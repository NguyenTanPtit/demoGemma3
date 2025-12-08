import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:path_provider/path_provider.dart';
import 'data/local/database.dart';
import 'data/remote/api_client.dart';
import 'data/services/gen_ai_service.dart';
import 'domain/repositories/chat_repository.dart';
import 'domain/repositories/work_repository.dart';
import 'domain/repositories/auth_repository.dart';
import 'logic/blocs/camera/camera_bloc.dart';
import 'logic/blocs/chat/chat_bloc.dart';
import 'logic/blocs/work/work_bloc.dart';
import 'presentation/router/router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final db = AppDatabase();
  final apiClient = ApiClient();
  final genAIService = GenAIService();

  final workRepo = WorkRepository(apiClient, db);
  final chatRepo = ChatRepository(genAIService);
  final authRepo = AuthRepository();

  runApp(
    MultiRepositoryProvider(
      providers: [
        RepositoryProvider(create: (_) => workRepo),
        RepositoryProvider(create: (_) => chatRepo),
        RepositoryProvider(create: (_) => authRepo),
      ],
      child: MultiBlocProvider(
        providers: [
          BlocProvider(create: (_) => WorkBloc(workRepo)),
          BlocProvider(create: (_) => ChatBloc(chatRepo)),
          BlocProvider(create: (_) => CameraBloc()),
        ],
        child: const MyApp(),
      ),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Demo Gemma3',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.pink),
        useMaterial3: true,
      ),
      routerConfig: router,
    );
  }
}
