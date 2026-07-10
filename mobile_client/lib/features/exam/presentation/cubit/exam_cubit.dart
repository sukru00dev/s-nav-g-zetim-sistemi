import 'package:flutter_bloc/flutter_bloc.dart';
import '../../data/repositories/exam_repository.dart';
import 'exam_state.dart';

class ExamCubit extends Cubit<ExamState> {
  final ExamRepository _repository;

  ExamCubit(this._repository) : super(ExamInitial());

  // Sınavları yükle
  Future<void> loadExams() async {
    emit(ExamLoading());
    try {
      final exams = await _repository.getStudentExams();
      emit(ExamLoaded(exams));
    } catch (e) {
      emit(ExamError(e.toString().replaceAll('Exception: ', '')));
    }
  }
}
