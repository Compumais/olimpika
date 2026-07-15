import 'dart:convert';

class AppUser {
  const AppUser({
    required this.id,
    required this.email,
    required this.fullName,
    required this.userType,
    this.avatarUrl,
  });

  final int id;
  final String email;
  final String fullName;
  final String userType;
  final String? avatarUrl;

  bool get isAluno => userType == 'aluno';
  bool get isPersonalOrAdmin => userType == 'personal' || userType == 'admin';

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: (json['id'] ?? 0) as int,
      email: (json['email'] ?? '') as String,
      fullName: (json['full_name'] ?? '') as String,
      userType: (json['user_type'] ?? 'aluno') as String,
      avatarUrl: json['avatar_url'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'full_name': fullName,
      'user_type': userType,
      'avatar_url': avatarUrl,
    };
  }

  String encode() => jsonEncode(toJson());
  static AppUser decode(String raw) => AppUser.fromJson(jsonDecode(raw));
}
