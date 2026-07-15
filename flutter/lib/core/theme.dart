import 'package:flutter/material.dart';

ThemeData buildOlimpikaTheme() {
  const yellow = Color(0xFFFACC15);
  const bg = Color(0xFF09090B);

  final scheme = ColorScheme.fromSeed(
    brightness: Brightness.dark,
    seedColor: yellow,
  ).copyWith(
    surface: const Color(0xFF18181B),
    primary: yellow,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: bg,
    appBarTheme: const AppBarTheme(
      backgroundColor: bg,
      foregroundColor: Colors.white,
      elevation: 0,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xFF18181B),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF27272A)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF27272A)),
      ),
    ),
  );
}
