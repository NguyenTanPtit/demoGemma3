# Flutter App - DemoGemma3

This project is a Flutter reimplementation of the React Native app.

## Prerequisites

*   Flutter SDK (Latest stable channel recommended)
*   Android Studio / Xcode for native build

## Setup Instructions

1.  **Dependencies**
    Navigate to the `flutter_app` directory and install dependencies:
    ```bash
    cd flutter_app
    flutter pub get
    ```

2.  **Code Generation (Important)**
    Since this project uses `drift` for the database, you must run the build runner to generate the database code (`database.g.dart`).
    **The app will not compile until this step is run.**
    ```bash
    flutter pub run build_runner build --delete-conflicting-outputs
    ```

3.  **Native Configuration (Crucial)**
    Before running on a device, you **must** configure native permissions and the AI host.

    **Android (`android/app/src/main/AndroidManifest.xml`):**
    Add the following permissions inside `<manifest>`:
    ```xml
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
    ```

    **iOS (`ios/Runner/Info.plist`):**
    Add usage descriptions:
    ```xml
    <key>NSCameraUsageDescription</key>
    <string>Camera access is required for photos/videos.</string>
    <key>NSMicrophoneUsageDescription</key>
    <string>Microphone access is required for video/audio recording.</string>
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>Location is required for watermarking photos.</string>
    <key>NSPhotoLibraryUsageDescription</key>
    <string>Photo library access is required to pick images.</string>
    ```

    **GenAI Native Implementation:**
    The Flutter app uses a `MethodChannel` (`com.demogemma3/genai`) to communicate with the native AI model. You must implement `MainActivity.kt` (Android) or `AppDelegate.swift` (iOS) to handle:
    *   `initModel()`
    *   `startStreamingResponse(prompt)`
    *   `shutdown()`
    And send events via `EventChannel` (`com.demogemma3/genai_events`).

4.  **Run the App**
    ```bash
    flutter run
    ```

## Architecture

*   **Clean Architecture:**
    *   `Data`: API Client, Drift Database, Native Services.
    *   `Domain`: Repositories and Interfaces.
    *   `Logic`: BLoCs (`WorkBloc`, `ChatBloc`, `CameraBloc`).
    *   `Presentation`: Screens and Widgets.

*   **Libraries:**
    *   `flutter_bloc`: State Management.
    *   `drift`: Local SQLite Database.
    *   `go_router`: Navigation.
    *   `dio`: HTTP Client.
    *   `camera`: Camera control.
    *   `geolocator`: Location services.
