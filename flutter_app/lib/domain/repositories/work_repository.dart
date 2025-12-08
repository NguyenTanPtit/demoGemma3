import 'dart:convert';
import 'package:dio/dio.dart';
import '../../data/local/database.dart';
import '../../data/models/work_entity.dart';
import '../../data/remote/api_client.dart';

class WorkRepository {
  final ApiClient _apiClient;
  final AppDatabase _db;

  WorkRepository(this._apiClient, this._db);

  Future<List<WorkEntity>> searchWorks({
    required int pageIndex,
    required int pageSize,
  }) async {
    try {
      final response = await _apiClient.post('/searchWork', data: {
        'pageIndex': pageIndex,
        'pageSize': pageSize,
      });

      if (response.statusCode == 200 && response.data['result'] != null) {
        final List<dynamic> list = response.data['result']['workList'];
        final works = list.map((e) => WorkEntity.fromJson(e)).toList();

        for (var workEntity in works) {
          await _db.insertOrUpdateWork(WorkItem(
            workId: workEntity.workId,
            workCode: workEntity.workCode,
            workDescription: workEntity.workDescription,
            workStatusName: workEntity.workStatusName,
            workStaffName: workEntity.workStaffName,
            workCreatedDate: workEntity.workCreatedDate,
            jsonContent: jsonEncode(workEntity.toJson()),
          ));
        }

        return works;
      }
      return [];
    } catch (e) {
      print('API Error: $e');
      // If offline, return local data
       final localWorks = await _db.getAllWorks();
       return localWorks.map((w) {
         if (w.jsonContent != null) {
           return WorkEntity.fromJson(jsonDecode(w.jsonContent!) as Map<String, dynamic>);
         }
         return WorkEntity(
           workId: w.workId,
           workCode: w.workCode,
           workDescription: w.workDescription,
           workStatusName: w.workStatusName,
           workStaffName: w.workStaffName,
           workCreatedDate: w.workCreatedDate,
         );
       }).toList();
    }
  }
}
