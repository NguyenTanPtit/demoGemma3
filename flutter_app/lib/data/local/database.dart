import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;
import 'dart:io';

// Include the generated part file
part 'database.g.dart';

@DataClassName('WorkItem')
class Works extends Table {
  IntColumn get workId => integer().nullable()();
  TextColumn get workCode => text()();
  TextColumn get workDescription => text().nullable()();
  TextColumn get workStatusName => text().nullable()();
  TextColumn get workStaffName => text().nullable()();
  TextColumn get workCreatedDate => text().nullable()();
  TextColumn get jsonContent => text().nullable()();

  @override
  Set<Column> get primaryKey => {workCode};
}

@DriftDatabase(tables: [Works])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 1;

  Future<void> insertOrUpdateWork(WorkItem work) {
    return into(works).insertOnConflictUpdate(work);
  }

  Future<List<WorkItem>> getAllWorks() {
    return select(works).get();
  }

  Future<void> clearWorks() {
    return delete(works).go();
  }
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dbFolder = await getApplicationDocumentsDirectory();
    final file = File(p.join(dbFolder.path, 'db.sqlite'));
    return NativeDatabase.createInBackground(file);
  });
}
