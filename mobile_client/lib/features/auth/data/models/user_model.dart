class UserModel {
  final int id;
  final String username;
  final String email;
  final String role;
  final String forename;
  final String surname;

  UserModel({
    required this.id,
    required this.username,
    required this.email,
    required this.role,
    required this.forename,
    required this.surname,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as int,
      username: json['username'] as String,
      email: json['email'] as String,
      role: json['role'] as String,
      forename: json['forename'] as String,
      surname: json['surname'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'role': role,
      'forename': forename,
      'surname': surname,
    };
  }
}
