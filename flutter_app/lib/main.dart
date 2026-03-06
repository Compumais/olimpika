import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'state/auth_state.dart';
import 'screens/login_screen.dart';
import 'screens/student_home_screen.dart';
import 'screens/personal_home_screen.dart';
import 'screens/webview_screen.dart';

void main() {
  runApp(const OlimpikaApp());
}

class OlimpikaApp extends StatelessWidget {
  const OlimpikaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AuthState(),
      child: MaterialApp(
        title: 'Olimpika Fitness',
        theme: ThemeData.dark().copyWith(
          colorScheme: const ColorScheme.dark(
            primary: Colors.yellow,
            secondary: Colors.yellowAccent,
          ),
          scaffoldBackgroundColor: const Color(0xFF09090B),
        ),
        debugShowCheckedModeBanner: false,
        initialRoute: '/',
        routes: {
          '/': (_) => const LoginScreen(),
          '/studentHome': (_) => const StudentHomeScreen(),
          '/personalHome': (_) => const PersonalHomeScreen(),
          // Exemplo: rota para abrir o front em React dentro de um WebView.
          // Ajuste a URL para onde seu front React está publicado.
          '/reactWeb': (_) => const ReactWebAppScreen(
                initialUrl: 'http://10.0.2.2:5173/',
              ),
        },
      ),
    );
  }
}
