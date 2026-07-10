import 'package:flutter_test/flutter_test.dart';
import 'package:leukolion_mobile/features/auth/data/models/user_model.dart';
import 'package:leukolion_mobile/features/exam/data/models/exam_model.dart';

void main() {
  group('Model Serialization & Deserialization Tests', () {
    test('UserModel.fromJson should correctly parse user JSON', () {
      final userJson = {
        'id': 12,
        'username': 'student123',
        'email': 'student@harran.edu.tr',
        'role': 'Öğrenci',
        'forename': 'Ahmet',
        'surname': 'Yılmaz',
      };

      final user = UserModel.fromJson(userJson);

      expect(user.id, 12);
      expect(user.username, 'student123');
      expect(user.email, 'student@harran.edu.tr');
      expect(user.role, 'Öğrenci');
      expect(user.forename, 'Ahmet');
      expect(user.surname, 'Yılmaz');

      final serialized = user.toJson();
      expect(serialized['id'], 12);
      expect(serialized['username'], 'student123');
    });

    test('ExamModel.fromJson should support duration and durationMin fallbacks', () {
      final examJsonWithDuration = {
        'id': 1,
        'title': 'Vize Sınavı',
        'description': 'Matematik-I vize sınavı',
        'startTime': '2026-07-10T10:00:00.000Z',
        'endTime': '2026-07-10T11:00:00.000Z',
        'duration': 60,
        'branchName': 'Matematik',
        'teacher': {
          'forename': 'Hasan',
          'surname': 'Kaya',
        }
      };

      final examWithDuration = ExamModel.fromJson(examJsonWithDuration);
      expect(examWithDuration.id, 1);
      expect(examWithDuration.duration, 60);
      expect(examWithDuration.teacherName, 'Hasan Kaya');

      final examJsonWithDurationMin = {
        'id': 2,
        'title': 'Final Sınavı',
        'description': 'Fizik-I final sınavı',
        'startTime': '2026-07-10T14:00:00.000Z',
        'endTime': '2026-07-10T15:00:00.000Z',
        'durationMin': 75,
        'branchName': 'Fizik',
        'teacher': null
      };

      final examWithDurationMin = ExamModel.fromJson(examJsonWithDurationMin);
      expect(examWithDurationMin.id, 2);
      expect(examWithDurationMin.duration, 75);
      expect(examWithDurationMin.teacherName, 'Bilinmiyor');
    });
  });
}
