import 'package:flutter/material.dart';

class AppTheme {
  // Harran Üniversitesi Renk Kodları
  static const Color primaryNavy = Color(0xFF002147);
  static const Color accentGold = Color(0xFFFFD700);
  static const Color lightGold = Color(0xFFFFE16D);
  
  static const Color bgDark = Color(0xFF020617); // Slate 950
  static const Color surfaceDark = Color(0xFF0F172A); // Slate 900
  static const Color cardDark = Color(0xFF1E293B); // Slate 800
  
  static const Color textPrimary = Color(0xFFF8FAFC); // Slate 50
  static const Color textSecondary = Color(0xFF94A3B8); // Slate 400
  static const Color textMuted = Color(0xFF64748B); // Slate 500
  
  static const Color errorRed = Color(0xFFE11D48); // Rose 600
  static const Color successGreen = Color(0xFF10B981); // Emerald 500
  static const Color warningOrange = Color(0xFFF59E0B); // Amber 500

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: bgDark,
      primaryColor: primaryNavy,
      colorScheme: const ColorScheme.dark(
        primary: accentGold,
        secondary: lightGold,
        surface: surfaceDark,
        error: errorRed,
      ),
      
      appBarTheme: const AppBarTheme(
        backgroundColor: surfaceDark,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          color: textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
        iconTheme: IconThemeData(color: textPrimary),
      ),
      
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: cardDark,
        labelStyle: const TextStyle(color: textSecondary, fontSize: 13),
        hintStyle: const TextStyle(color: textMuted, fontSize: 13),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF334155)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF334155)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: accentGold, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: errorRed),
        ),
      ),
      
      buttonTheme: const ButtonThemeData(
        buttonColor: accentGold,
        textTheme: ButtonTextTheme.primary,
      ),
      
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: accentGold,
          foregroundColor: primaryNavy,
          elevation: 2,
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      
      textTheme: const TextTheme(
        headlineLarge: TextStyle(color: textPrimary, fontSize: 28, fontWeight: FontWeight.bold),
        headlineMedium: TextStyle(color: textPrimary, fontSize: 22, fontWeight: FontWeight.bold),
        titleLarge: TextStyle(color: textPrimary, fontSize: 16, fontWeight: FontWeight.bold),
        bodyLarge: TextStyle(color: textPrimary, fontSize: 14),
        bodyMedium: TextStyle(color: textSecondary, fontSize: 13),
        labelLarge: TextStyle(color: textPrimary, fontSize: 12, fontWeight: FontWeight.w600),
      ),
    );
  }
}
