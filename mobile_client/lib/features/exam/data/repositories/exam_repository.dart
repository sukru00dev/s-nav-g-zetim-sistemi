import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/dio_client.dart';
import '../models/exam_model.dart';

class ExamRepository {
  final DioClient _client;

  ExamRepository(this._client);

  // Öğrenciye atanan sınavları getir
  Future<List<ExamModel>> getStudentExams() async {
    try {
      final response = await _client.get(ApiConstants.getStudentExams);
      final list = response.data as List<dynamic>;
      return list.map((json) => ExamModel.fromJson(json as Map<String, dynamic>)).toList();
    } catch (e) {
      rethrow;
    }
  }
}
