import 'package:flutter/material.dart';

class AppTheme {
  // Harran Üniversitesi Renk Kodları (Stitch Entegrasyonu)
  static const Color primaryNavy = Color(0xFF002147); // Dark Navy
  static const Color primaryBlue = Color(0xFF00306E); // Primary Blue
  static const Color accentGold = Color(0xFFFCD400);  // Harran Altını
  static const Color lightGold = Color(0xFFFFE16D);
  
  static const Color bgLight = Color(0xFFF8FAFC);     // Arka Plan
  static const Color surfaceLight = Color(0xFFFFFFFF); // Kart / Yüzey
  
  static const Color textPrimary = Color(0xFF0F172A);   // Slate 900
  static const Color textSecondary = Color(0xFF475569); // Slate 600
  static const Color textMuted = Color(0xFF94A3B8);     // Slate 400
  
  static const Color errorRed = Color(0xFFD93025);      // Stitch Kırmızı
  static const Color successGreen = Color(0xFF2E7D32);  // Stitch Yeşil
  static const Color warningOrange = Color(0xFFF57C00);  // Stitch Turuncu

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: bgLight,
      primaryColor: primaryBlue,
      
      colorScheme: const ColorScheme.light(
        primary: primaryBlue,
        secondary: accentGold,
        surface: surfaceLight,
        error: errorRed,
      ),
      
      appBarTheme: const AppBarTheme(
        backgroundColor: primaryNavy,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          color: Colors.white,
          fontSize: 16,
          fontWeight: FontWeight.bold,
          fontFamily: 'Inter',
        ),
        iconTheme: IconThemeData(color: Colors.white),
      ),
      
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: bgLight,
        labelStyle: const TextStyle(color: textSecondary, fontSize: 13, fontFamily: 'Inter'),
        hintStyle: const TextStyle(color: textMuted, fontSize: 13, fontFamily: 'Inter'),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: primaryBlue, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: errorRed),
        ),
      ),
      
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryBlue,
          foregroundColor: Colors.white,
          elevation: 2,
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            fontFamily: 'Inter',
          ),
        ),
      ),
      
      textTheme: const TextTheme(
        headlineLarge: TextStyle(color: textPrimary, fontSize: 28, fontWeight: FontWeight.bold, fontFamily: 'Inter'),
        headlineMedium: TextStyle(color: textPrimary, fontSize: 20, fontWeight: FontWeight.bold, fontFamily: 'Inter'),
        titleLarge: TextStyle(color: textPrimary, fontSize: 16, fontWeight: FontWeight.bold, fontFamily: 'Inter'),
        bodyLarge: TextStyle(color: textPrimary, fontSize: 14, fontFamily: 'Inter'),
        bodyMedium: TextStyle(color: textSecondary, fontSize: 13, fontFamily: 'Inter'),
        labelLarge: TextStyle(color: textPrimary, fontSize: 12, fontWeight: FontWeight.w600, fontFamily: 'Inter'),
      ),
    );
  }
}
