import 'package:flutter/material.dart';
import 'package:olimpika_flutter/core/theme.dart';
import 'package:olimpika_flutter/screens/root_shell.dart';
import 'package:olimpika_flutter/services/auth_service.dart';

void main() {
  runApp(const OlimpikaApp());
}

class OlimpikaApp extends StatelessWidget {
  const OlimpikaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Olimpika',
      debugShowCheckedModeBanner: false,
      theme: buildOlimpikaTheme(),
      home: RootShell(authService: AuthService()),
    );
  }
}
