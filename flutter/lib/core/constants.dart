class AppConstants {
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://olimpika.onrender.com:4000',
  );

  static const storageUserKey = 'academia_user';
}
