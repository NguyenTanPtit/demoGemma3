import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../data/models/work_entity.dart';
import '../../../domain/repositories/work_repository.dart';

// Events
abstract class WorkEvent extends Equatable {
  const WorkEvent();
  @override
  List<Object> get props => [];
}

class LoadWorks extends WorkEvent {
  final int pageIndex;
  const LoadWorks({this.pageIndex = 0});
}

// State
abstract class WorkState extends Equatable {
  const WorkState();
  @override
  List<Object> get props => [];
}

class WorkInitial extends WorkState {}
class WorkLoading extends WorkState {}
class WorkLoaded extends WorkState {
  final List<WorkEntity> works;
  const WorkLoaded(this.works);
  @override
  List<Object> get props => [works];
}
class WorkError extends WorkState {
  final String message;
  const WorkError(this.message);
}

// Bloc
class WorkBloc extends Bloc<WorkEvent, WorkState> {
  final WorkRepository repository;

  WorkBloc(this.repository) : super(WorkInitial()) {
    on<LoadWorks>(_onLoadWorks);
  }

  Future<void> _onLoadWorks(LoadWorks event, Emitter<WorkState> emit) async {
    emit(WorkLoading());
    try {
      final works = await repository.searchWorks(pageIndex: event.pageIndex, pageSize: 20);
      emit(WorkLoaded(works));
    } catch (e) {
      emit(WorkError(e.toString()));
    }
  }
}
