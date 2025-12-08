import 'dart:io';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:path_provider/path_provider.dart';
import 'package:flutter/rendering.dart';
import 'dart:ui' as ui;
import 'package:flutter/services.dart';
import '../../logic/blocs/camera/camera_bloc.dart';

class CameraScreen extends StatefulWidget {
  const CameraScreen({Key? key}) : super(key: key);

  @override
  State<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen> {
  final GlobalKey _previewKey = GlobalKey();

  @override
  void initState() {
    super.initState();
    context.read<CameraBloc>().add(CameraInit());
  }

  Future<void> _takePicture() async {
    final bloc = context.read<CameraBloc>();
    if (bloc.state.hasWatermark) {
      try {
        RenderRepaintBoundary boundary = _previewKey.currentContext!.findRenderObject() as RenderRepaintBoundary;
        ui.Image image = await boundary.toImage(pixelRatio: 3.0);
        ByteData? byteData = await image.toByteData(format: ui.ImageByteFormat.png);
        Uint8List pngBytes = byteData!.buffer.asUint8List();

        final dir = await getTemporaryDirectory();
        final path = '${dir.path}/watermark_${DateTime.now().millisecondsSinceEpoch}.png';
        final file = File(path);
        await file.writeAsBytes(pngBytes);

        if (mounted) context.push('/preview', extra: {'path': path, 'isVideo': false});
      } catch (e) {
        print(e);
      }
    } else {
      try {
        final image = await bloc.state.controller!.takePicture();
        if (mounted) context.push('/preview', extra: {'path': image.path, 'isVideo': false});
      } catch (e) {
         print(e);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<CameraBloc, CameraState>(
      listener: (context, state) {
        if (state.error != null) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(state.error!)));
        }
      },
      builder: (context, state) {
        if (!state.isInitialized || state.controller == null) {
          return const Center(child: CircularProgressIndicator());
        }

        return Scaffold(
          body: Stack(
            children: [
              // Camera Preview
              RepaintBoundary(
                key: _previewKey,
                child: Stack(
                  children: [
                    SizedBox.expand(
                        child: CameraPreview(state.controller!)
                    ),
                    if (state.hasWatermark)
                      Positioned(
                        bottom: 20,
                        right: 20,
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          color: Colors.black54,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(DateTime.now().toString(), style: const TextStyle(color: Colors.white)),
                              Text(
                                state.location != null
                                  ? 'Lat: ${state.location!.latitude.toStringAsFixed(4)}, Long: ${state.location!.longitude.toStringAsFixed(4)}'
                                  : 'Fetching location...',
                                style: const TextStyle(color: Colors.white)
                              ),
                              const Text('User: tannv5', style: TextStyle(color: Colors.white)),
                            ],
                          ),
                        ),
                      )
                  ],
                ),
              ),

              // Controls
              Positioned(
                bottom: 30,
                left: 0,
                right: 0,
                child: Column(
                  children: [
                    Slider(
                      value: state.zoom,
                      min: state.minZoom,
                      max: state.maxZoom,
                      onChanged: (val) => context.read<CameraBloc>().add(CameraSetZoom(val)),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        IconButton(
                          icon: Icon(Icons.branding_watermark, color: state.hasWatermark ? Colors.blue : Colors.white),
                          onPressed: () => context.read<CameraBloc>().add(CameraToggleWatermark()),
                        ),
                        FloatingActionButton(
                          onPressed: state.isRecording
                            ? () => context.read<CameraBloc>().add(CameraStopVideo())
                            : _takePicture,
                          backgroundColor: state.isRecording ? Colors.red : Colors.white,
                          child: Icon(state.isRecording ? Icons.stop : Icons.camera),
                        ),
                        IconButton(
                          icon: Icon(Icons.videocam, color: state.isRecording ? Colors.red : Colors.white),
                          onPressed: () {
                             if(state.isRecording) {
                               context.read<CameraBloc>().add(CameraStopVideo());
                             } else {
                               context.read<CameraBloc>().add(CameraStartVideo());
                             }
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              )
            ],
          ),
        );
      },
    );
  }
}
