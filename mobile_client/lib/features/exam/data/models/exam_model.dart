class ExamModel {
  final int id;
  final String title;
  final String description;
  final DateTime startTime;
  final DateTime endTime;
  final int duration;
  final String branchName;
  final String teacherName;

  ExamModel({
    required this.id,
    required this.title,
    required this.description,
    required this.startTime,
    required this.endTime,
    required this.duration,
    required this.branchName,
    required this.teacherName,
  });

  factory ExamModel.fromJson(Map<String, dynamic> json) {
    final teacher = json['teacher'] as Map<String, dynamic>?;
    final teacherForename = teacher?['forename'] as String? ?? '';
    final teacherSurname = teacher?['surname'] as String? ?? '';
    final teacherName = '$teacherForename $teacherSurname'.trim();

    return ExamModel(
      id: json['id'] as int,
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      startTime: DateTime.parse(json['startTime'] as String),
      endTime: DateTime.parse(json['endTime'] as String),
      duration: json['duration'] as int? ?? 0,
      branchName: json['branchName'] as String? ?? 'Genel',
      teacherName: teacherName.isEmpty ? 'Bilinmiyor' : teacherName,
    );
  }

  // Sınav aktif mi kontrol et (Başlangıç ve bitiş saatleri arasında mı?)
  bool get isActive {
    final now = DateTime.now();
    return now.isAfter(startTime) && now.isBefore(endTime);
  }

  // Sınavın başlamasına ne kadar kaldı veya bitti mi kontrolü
  String get statusText {
    final now = DateTime.now();
    if (now.isBefore(startTime)) {
      return 'Gelecek Sınav';
    } else if (now.isAfter(endTime)) {
      return 'Tamamlandı';
    } else {
      return 'Aktif Sınav';
    }
  }
}
