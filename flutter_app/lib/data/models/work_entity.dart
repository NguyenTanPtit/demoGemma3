class WorkEntity {
  final int? workId;
  final String? workName;
  final String workCode;
  final String? workTypeId;
  final String? workTypeName;
  final String? workProgressId;
  final String? workProgressName;
  final String? workStatusId;
  final String? workStatusName;
  final String? workDescription;
  final String? workStartDate;
  final String? workDeadline;
  final String? workCreatedDate;
  final String? workModifiedAt;
  final String? workCusName;
  final String? workCusPhone;
  final String? workCusAcc;
  final String? workGroupId;
  final String? workStaffId;
  final String? workStaffName;
  final String? workStaffUsername;
  final String? workStaffAvatar;
  final String? workPriority;
  final String? workSystemGroup;
  final String? lstCd;
  final String? woTypeCode;
  final String? needStart;
  final String? needStop;

  WorkEntity({
    this.workId,
    this.workName,
    required this.workCode,
    this.workTypeId,
    this.workTypeName,
    this.workProgressId,
    this.workProgressName,
    this.workStatusId,
    this.workStatusName,
    this.workDescription,
    this.workStartDate,
    this.workDeadline,
    this.workCreatedDate,
    this.workModifiedAt,
    this.workCusName,
    this.workCusPhone,
    this.workCusAcc,
    this.workGroupId,
    this.workStaffId,
    this.workStaffName,
    this.workStaffUsername,
    this.workStaffAvatar,
    this.workPriority,
    this.workSystemGroup,
    this.lstCd,
    this.woTypeCode,
    this.needStart,
    this.needStop,
  });

  factory WorkEntity.fromJson(Map<String, dynamic> json) {
    return WorkEntity(
      workId: json['workId'] as int?,
      workName: json['workName'] as String?,
      workCode: json['workCode'] as String? ?? '',
      workTypeId: json['workTypeId'] as String?,
      workTypeName: json['workTypeName'] as String?,
      workProgressId: json['workProgressId'] as String?,
      workProgressName: json['workProgressName'] as String?,
      workStatusId: json['workStatusId'] as String?,
      workStatusName: json['workStatusName'] as String?,
      workDescription: json['workDescription'] as String?,
      workStartDate: json['workStartDate'] as String?,
      workDeadline: json['workDeadline'] as String?,
      workCreatedDate: json['workCreatedDate'] as String?,
      workModifiedAt: json['workModifiedAt'] as String?,
      workCusName: json['workCusName'] as String?,
      workCusPhone: json['workCusPhone'] as String?,
      workCusAcc: json['workCusAcc'] as String?,
      workGroupId: json['workGroupId'] as String?,
      workStaffId: json['workStaffId'] as String?,
      workStaffName: json['workStaffName'] as String?,
      workStaffUsername: json['workStaffUsername'] as String?,
      workStaffAvatar: json['workStaffAvatar'] as String?,
      workPriority: json['workPriority'] as String?,
      workSystemGroup: json['workSystemGroup'] as String?,
      lstCd: json['lstCd'] as String?,
      woTypeCode: json['woTypeCode'] as String?,
      needStart: json['needStart'] as String?,
      needStop: json['needStop'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'workId': workId,
      'workName': workName,
      'workCode': workCode,
      'workTypeId': workTypeId,
      'workTypeName': workTypeName,
      'workProgressId': workProgressId,
      'workProgressName': workProgressName,
      'workStatusId': workStatusId,
      'workStatusName': workStatusName,
      'workDescription': workDescription,
      'workStartDate': workStartDate,
      'workDeadline': workDeadline,
      'workCreatedDate': workCreatedDate,
      'workModifiedAt': workModifiedAt,
      'workCusName': workCusName,
      'workCusPhone': workCusPhone,
      'workCusAcc': workCusAcc,
      'workGroupId': workGroupId,
      'workStaffId': workStaffId,
      'workStaffName': workStaffName,
      'workStaffUsername': workStaffUsername,
      'workStaffAvatar': workStaffAvatar,
      'workPriority': workPriority,
      'workSystemGroup': workSystemGroup,
      'lstCd': lstCd,
      'woTypeCode': woTypeCode,
      'needStart': needStart,
      'needStop': needStop,
    };
  }
}
