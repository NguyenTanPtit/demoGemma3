import 'package:flutter/material.dart';
import 'chat_screen.dart';
import 'search_work_screen.dart';
import 'camera_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({Key? key}) : super(key: key);

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: [
          const ChatScreen(),
          const SearchWorkScreen(),
          // Only mount CameraScreen when active to save resources,
          // or pass a flag if we want to keep state but stop preview.
          // Here we use a key to force rebuild or we can pass the index.
          // For simplicity and resource saving:
           _currentIndex == 2 ? const CameraScreen() : const SizedBox(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.chat), label: 'Chat'),
          BottomNavigationBarItem(icon: Icon(Icons.work), label: 'Work'),
          BottomNavigationBarItem(icon: Icon(Icons.camera_alt), label: 'Camera'),
        ],
      ),
    );
  }
}
