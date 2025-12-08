import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../domain/repositories/auth_repository.dart';
import '../screens/main_screen.dart';
import '../screens/chat_screen.dart';
import '../screens/search_work_screen.dart';
import '../screens/camera_screen.dart';
import '../screens/preview_screen.dart';
import '../screens/login_screen.dart';

// Simple redirect logic would go here in a real app
final GoRouter router = GoRouter(
  initialLocation: '/login',
  routes: [
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/',
      builder: (context, state) => const MainScreen(),
    ),
    GoRoute(
      path: '/preview',
      builder: (context, state) {
         final extra = state.extra as Map<String, dynamic>?;
         return PreviewScreen(
           filePath: extra?['path'] as String,
           isVideo: extra?['isVideo'] as bool,
         );
      },
    ),
  ],
);
