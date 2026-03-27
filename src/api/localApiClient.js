const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

async function apiRequest(method, path, { params = {}, body } = {}) {
  const url = new URL(path, API_BASE_URL);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });

  const init = { method, headers: {} };

  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  const res = await fetch(url.toString(), init);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let message = text || res.statusText;
    try {
      const json = JSON.parse(text);
      if (json.detail) message = typeof json.detail === 'string' ? json.detail : json.detail.message || message;
    } catch (_) {}
    throw new Error(message);
  }

  // 204 No Content
  if (res.status === 204) {
    return null;
  }
  return res.json();
}

const apiGet = (path, params) => apiRequest('GET', path, { params });
const apiPost = (path, body) => apiRequest('POST', path, { body });
const apiPut = (path, body) => apiRequest('PUT', path, { body });
const apiDelete = (path, params) => apiRequest('DELETE', path, { params });

const actorToPayload = (actor) => ({
  actor_id: actor?.id,
  actor_email: actor?.email,
});

function normalizeWorkoutSession(row) {
  const durationMinutes = row.duration_minutes;
  let parsedDuration = Number(durationMinutes);
  if (Number.isNaN(parsedDuration)) {
    parsedDuration = 0;
  }

  let exercisesCompleted = row.exercises_completed;
  if (typeof exercisesCompleted === 'string') {
    try {
      exercisesCompleted = exercisesCompleted ? JSON.parse(exercisesCompleted) : [];
    } catch {
      exercisesCompleted = [];
    }
  }

  return {
    ...row,
    duration_minutes: parsedDuration,
    exercises_completed: exercisesCompleted,
  };
}

export const localApi = {
  // Auth (SQLite) ------------------------------------------------------------
  async login(email, password) {
    return apiPost('/auth/login', { email, password });
  },

  async register(payload) {
    return apiPost('/auth/register', payload);
  },

  async resetPassword(email, newPassword) {
    return apiPost('/auth/reset-password', { email, new_password: newPassword });
  },

  async getUsers() {
    return apiGet('/auth/users');
  },

  // Workout sessions ---------------------------------------------------------
  async getWorkoutSessionsByUserEmail(userEmail) {
    if (!userEmail) return [];
    const rows = await apiGet('/workout-sessions', { user_email: userEmail });
    return rows.map(normalizeWorkoutSession);
  },

  async createWorkoutSession(data) {
    const row = await apiPost('/workout-sessions', data);
    return normalizeWorkoutSession(row);
  },

  async updateWorkoutSession(id, data) {
    // #region agent log
    fetch('http://127.0.0.1:7878/ingest/edf88b8a-a771-462f-8c17-2acdeb22ffe5', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': 'c7559d',
      },
      body: JSON.stringify({
        sessionId: 'c7559d',
        runId: 'pre-fix',
        hypothesisId: 'H2',
        location: 'localApiClient.js:updateWorkoutSession',
        message: 'Calling apiPut for workout-session',
        data: {
          id,
          keys: Object.keys(data || {}),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion agent log

    const row = await apiPut(`/workout-sessions/${id}`, data);
    return normalizeWorkoutSession(row);
  },

  // Workouts -----------------------------------------------------------------
  async getWorkouts(params) {
    return apiGet('/workouts', params ?? {});
  },

  async getWorkoutById(id) {
    return apiGet(`/workouts/${id}`);
  },

  async createWorkout(data) {
    return apiPost('/workouts', data);
  },

  async updateWorkout(id, data) {
    return apiPut(`/workouts/${id}`, data);
  },

  async deleteWorkout(id) {
    return apiDelete(`/workouts/${id}`);
  },

  // Workout templates ---------------------------------------------------------
  async getWorkoutTemplates(params) {
    return apiGet('/workout-templates', params ?? {});
  },

  async createWorkoutTemplate(data, actor) {
    return apiPost('/workout-templates', { ...data, ...actorToPayload(actor) });
  },

  async updateWorkoutTemplate(id, data, actor) {
    return apiPut(`/workout-templates/${id}`, { ...data, ...actorToPayload(actor) });
  },

  async deleteWorkoutTemplate(id, actor) {
    return apiDelete(`/workout-templates/${id}`, actorToPayload(actor));
  },

  async getTemplateExercisesByTemplateId(templateId) {
    return apiGet(`/workout-templates/${templateId}/exercises`);
  },

  async createTemplateExercise(templateId, data, actor) {
    return apiPost(`/workout-templates/${templateId}/exercises`, { ...data, ...actorToPayload(actor) });
  },

  async updateTemplateExercise(templateId, exerciseId, data, actor) {
    return apiPut(`/workout-templates/${templateId}/exercises/${exerciseId}`, { ...data, ...actorToPayload(actor) });
  },

  async deleteTemplateExercise(templateId, exerciseId, actor) {
    return apiDelete(`/workout-templates/${templateId}/exercises/${exerciseId}`, actorToPayload(actor));
  },

  async assignWorkoutTemplate(studentId, templateId, actor, notes = '', expiresAt = '') {
    return apiPost(`/students/${studentId}/template-assignments`, {
      template_id: templateId,
      notes,
      expires_at: expiresAt || undefined,
      ...actorToPayload(actor),
    });
  },

  async getStudentTemplateAssignments(studentId) {
    return apiGet(`/students/${studentId}/template-assignments`);
  },

  async removeStudentTemplateAssignment(studentId, assignmentId, actor) {
    return apiDelete(`/students/${studentId}/template-assignments/${assignmentId}`, actorToPayload(actor));
  },

  // Exercises ----------------------------------------------------------------
  async getTemplateExercises() {
    return apiGet('/exercises', { is_template: 'true' });
  },

  async getExercisesByWorkoutId(workoutId) {
    if (!workoutId) return [];
    return apiGet('/exercises', { workout_id: workoutId });
  },

  async createExercise(data) {
    return apiPost('/exercises', data);
  },

  async updateExercise(id, data) {
    return apiPut(`/exercises/${id}`, data);
  },

  async deleteExercise(id) {
    return apiDelete(`/exercises/${id}`);
  },

  // Students -----------------------------------------------------------------
  async getStudents(params = {}) {
    const merged = { ...params, with_workout_summary: true };
    return apiGet('/students', merged);
  },

  async createStudent(data) {
    return apiPost('/students', data);
  },

  async getStudent(id) {
    return apiGet(`/students/${id}`);
  },

  async updateStudent(id, data) {
    return apiPut(`/students/${id}`, data);
  },
};

