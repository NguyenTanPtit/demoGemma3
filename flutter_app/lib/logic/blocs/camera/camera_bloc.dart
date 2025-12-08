import 'package:camera/camera.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:geolocator/geolocator.dart';

// Events
abstract class CameraEvent extends Equatable {
  const CameraEvent();
  @override
  List<Object?> get props => [];
}

class CameraInit extends CameraEvent {}
class CameraSetZoom extends CameraEvent {
  final double zoom;
  const CameraSetZoom(this.zoom);
}
class CameraToggleWatermark extends CameraEvent {}
class CameraStartVideo extends CameraEvent {}
class CameraStopVideo extends CameraEvent {}
class CameraCapturePhoto extends CameraEvent {}

// State
class CameraState extends Equatable {
  final CameraController? controller;
  final bool isInitialized;
  final double zoom;
  final double maxZoom;
  final double minZoom;
  final bool hasWatermark;
  final bool isRecording;
  final String? error;
  final Position? location; // Added location

  const CameraState({
    this.controller,
    this.isInitialized = false,
    this.zoom = 1.0,
    this.maxZoom = 1.0,
    this.minZoom = 1.0,
    this.hasWatermark = true,
    this.isRecording = false,
    this.error,
    this.location,
  });

  CameraState copyWith({
    CameraController? controller,
    bool? isInitialized,
    double? zoom,
    double? maxZoom,
    double? minZoom,
    bool? hasWatermark,
    bool? isRecording,
    String? error,
    Position? location,
  }) {
    return CameraState(
      controller: controller ?? this.controller,
      isInitialized: isInitialized ?? this.isInitialized,
      zoom: zoom ?? this.zoom,
      maxZoom: maxZoom ?? this.maxZoom,
      minZoom: minZoom ?? this.minZoom,
      hasWatermark: hasWatermark ?? this.hasWatermark,
      isRecording: isRecording ?? this.isRecording,
      error: error,
      location: location ?? this.location,
    );
  }

  @override
  List<Object?> get props => [controller, isInitialized, zoom, maxZoom, minZoom, hasWatermark, isRecording, error, location];
}

// Bloc
class CameraBloc extends Bloc<CameraEvent, CameraState> {
  CameraBloc() : super(const CameraState()) {
    on<CameraInit>(_onInit);
    on<CameraSetZoom>(_onSetZoom);
    on<CameraToggleWatermark>(_onToggleWatermark);
    on<CameraStartVideo>(_onStartVideo);
    on<CameraStopVideo>(_onStopVideo);
  }

  Future<void> _onInit(CameraInit event, Emitter<CameraState> emit) async {
    try {
      // 1. Initialize Camera
      final cameras = await availableCameras();
      if (cameras.isEmpty) throw Exception('No cameras available');

      final controller = CameraController(
        cameras.first,
        ResolutionPreset.high,
        enableAudio: true,
      );

      await controller.initialize();
      final minZoom = await controller.getMinZoomLevel();
      final maxZoom = await controller.getMaxZoomLevel();

      // 2. Get Location
      Position? position;
      try {
        bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
        if (serviceEnabled) {
          LocationPermission permission = await Geolocator.checkPermission();
          if (permission == LocationPermission.denied) {
            permission = await Geolocator.requestPermission();
          }
          if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
            position = await Geolocator.getCurrentPosition();
          }
        }
      } catch (e) {
        print("Location error: $e");
      }

      emit(state.copyWith(
        controller: controller,
        isInitialized: true,
        minZoom: minZoom,
        maxZoom: maxZoom,
        zoom: 1.0,
        location: position,
      ));
    } catch (e) {
      emit(state.copyWith(error: e.toString()));
    }
  }

  Future<void> _onSetZoom(CameraSetZoom event, Emitter<CameraState> emit) async {
    if (state.controller != null && state.isInitialized) {
      await state.controller!.setZoomLevel(event.zoom);
      emit(state.copyWith(zoom: event.zoom));
    }
  }

  void _onToggleWatermark(CameraToggleWatermark event, Emitter<CameraState> emit) {
    emit(state.copyWith(hasWatermark: !state.hasWatermark));
  }

  Future<void> _onStartVideo(CameraStartVideo event, Emitter<CameraState> emit) async {
    if (state.controller != null && !state.isRecording) {
      try {
        await state.controller!.startVideoRecording();
        emit(state.copyWith(isRecording: true, hasWatermark: false));
      } catch (e) {
        emit(state.copyWith(error: e.toString()));
      }
    }
  }

  Future<void> _onStopVideo(CameraStopVideo event, Emitter<CameraState> emit) async {
    if (state.controller != null && state.isRecording) {
      try {
        final file = await state.controller!.stopVideoRecording();
        emit(state.copyWith(isRecording: false));
      } catch (e) {
        emit(state.copyWith(error: e.toString()));
      }
    }
  }

  @override
  Future<void> close() {
    state.controller?.dispose();
    return super.close();
  }
}
