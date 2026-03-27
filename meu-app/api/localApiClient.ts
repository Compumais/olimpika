import { axiosClient } from './axiosClient';

type ApiParams = Record<string, string | number | boolean | undefined | null>;

function cleanParams(params: ApiParams) {
  const cleaned: Record<string, string | number | boolean> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value as string | number | boolean;
    }
  });
  return cleaned;
}

async function apiRequest(
  method: string,
  path: string,
  { params = {}, body }: { params?: ApiParams; body?: unknown } = {}
) {
  const config: { params?: Record<string, string | number | boolean>; data?: unknown } = {};
  const cleaned = cleanParams(params);
  if (Object.keys(cleaned).length > 0) config.params = cleaned;
  if (body !== undefined) config.data = body;

  try {
    const res = await axiosClient.request({ method, url: path, ...config });
    if (res.status === 204) return null;
    return res.data;
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: unknown; statusText?: string }; message?: string };
    const data = axiosError.response?.data;
    let message = axiosError.message || axiosError.response?.statusText || 'Erro na requisição';
    if (data && typeof data === 'object' && 'detail' in data) {
      const d = (data as { detail: unknown }).detail;
      message = typeof d === 'string' ? d : (d as { message?: string })?.message || message;
    }
    throw new Error(message);
  }
}

const apiGet = (path: string, params?: ApiParams) =>
  apiRequest('GET', path, { params });
const apiPost = (path: string, body?: unknown) => apiRequest('POST', path, { body });
const apiPut = (path: string, body?: unknown) => apiRequest('PUT', path, { body });
const apiDelete = (path: string, params?: ApiParams) =>
  apiRequest('DELETE', path, { params });

function actorToPayload(actor: { id?: string; email?: string } | null | undefined) {
  return {
    actor_id: actor?.id,
    actor_email: actor?.email,
  };
}

function normalizeWorkoutSession(row: Record<string, unknown>) {
  const durationMinutes = row.duration_minutes;
  let parsedDuration = Number(durationMinutes);
  if (Number.isNaN(parsedDuration)) parsedDuration = 0;

  let exercisesCompleted = row.exercises_completed;
  if (typeof exercisesCompleted === 'string') {
    try {
      exercisesCompleted = exercisesCompleted
        ? (JSON.parse(exercisesCompleted) as unknown[])
        : [];
    } catch {
      exercisesCompleted = [];
    }
  }

  return { ...row, duration_minutes: parsedDuration, exercises_completed: exercisesCompleted };
}

export const localApi = {
  async login(email: string, password: string) {
    return apiPost('/auth/login', { email, password }) as Promise<Record<string, unknown>>;
  },

  async register(payload: Record<string, unknown>) {
    return apiPost('/auth/register', payload) as Promise<Record<string, unknown>>;
  },

  async resetPassword(email: string, newPassword: string) {
    return apiPost('/auth/reset-password', { email, new_password: newPassword });
  },

  async getUsers() {
    return apiGet('/auth/users') as Promise<Record<string, unknown>[]>;
  },

  async getWorkoutSessionsByUserEmail(userEmail: string) {
    if (!userEmail) return [];
    const rows = (await apiGet('/workout-sessions', {
      user_email: userEmail,
    })) as Record<string, unknown>[];
    return rows.map(normalizeWorkoutSession);
  },

  async createWorkoutSession(data: Record<string, unknown>) {
    const row = (await apiPost('/workout-sessions', data)) as Record<string, unknown>;
    return normalizeWorkoutSession(row);
  },

  async updateWorkoutSession(
    id: string,
    data: Record<string, unknown>
  ) {
    const row = (await apiPut(`/workout-sessions/${id}`, data)) as Record<string, unknown>;
    return normalizeWorkoutSession(row);
  },

  async getWorkouts(params?: Record<string, string | number | undefined>) {
    return apiGet('/workouts', params ?? {}) as Promise<Record<string, unknown>[]>;
  },

  async getWorkoutById(id: string) {
    return apiGet(`/workouts/${id}`) as Promise<Record<string, unknown> | null>;
  },

  async createWorkout(data: Record<string, unknown>) {
    return apiPost('/workouts', data) as Promise<Record<string, unknown>>;
  },

  async updateWorkout(id: string, data: Record<string, unknown>) {
    return apiPut(`/workouts/${id}`, data) as Promise<Record<string, unknown>>;
  },

  async deleteWorkout(id: string) {
    return apiDelete(`/workouts/${id}`);
  },

  async getWorkoutTemplates(params?: ApiParams) {
    return apiGet('/workout-templates', params ?? {}) as Promise<Record<string, unknown>[]>;
  },

  async createWorkoutTemplate(
    data: Record<string, unknown>,
    actor: { id?: string; email?: string }
  ) {
    return apiPost('/workout-templates', {
      ...data,
      ...actorToPayload(actor),
    }) as Promise<Record<string, unknown>>;
  },

  async updateWorkoutTemplate(
    id: string,
    data: Record<string, unknown>,
    actor: { id?: string; email?: string }
  ) {
    return apiPut(`/workout-templates/${id}`, {
      ...data,
      ...actorToPayload(actor),
    }) as Promise<Record<string, unknown>>;
  },

  async deleteWorkoutTemplate(id: string, actor: { id?: string; email?: string }) {
    return apiDelete(`/workout-templates/${id}`, actorToPayload(actor));
  },

  async getTemplateExercisesByTemplateId(templateId: string) {
    return apiGet(
      `/workout-templates/${templateId}/exercises`
    ) as Promise<Record<string, unknown>[]>;
  },

  async createTemplateExercise(
    templateId: string,
    data: Record<string, unknown>,
    actor: { id?: string; email?: string }
  ) {
    return apiPost(`/workout-templates/${templateId}/exercises`, {
      ...data,
      ...actorToPayload(actor),
    }) as Promise<Record<string, unknown>>;
  },

  async updateTemplateExercise(
    templateId: string,
    exerciseId: string,
    data: Record<string, unknown>,
    actor: { id?: string; email?: string }
  ) {
    return apiPut(`/workout-templates/${templateId}/exercises/${exerciseId}`, {
      ...data,
      ...actorToPayload(actor),
    }) as Promise<Record<string, unknown>>;
  },

  async deleteTemplateExercise(
    templateId: string,
    exerciseId: string,
    actor: { id?: string; email?: string }
  ) {
    return apiDelete(`/workout-templates/${templateId}/exercises/${exerciseId}`, actorToPayload(actor));
  },

  async assignWorkoutTemplate(
    studentId: string,
    templateId: string,
    actor: { id?: string; email?: string },
    notes = '',
    expiresAt = ''
  ) {
    return apiPost(`/students/${studentId}/template-assignments`, {
      template_id: templateId,
      notes,
      expires_at: expiresAt || undefined,
      ...actorToPayload(actor),
    });
  },

  async getStudentTemplateAssignments(studentId: string) {
    return apiGet(`/students/${studentId}/template-assignments`) as Promise<
      Record<string, unknown>[]
    >;
  },

  async removeStudentTemplateAssignment(
    studentId: string,
    assignmentId: string,
    actor: { id?: string; email?: string }
  ) {
    return apiDelete(
      `/students/${studentId}/template-assignments/${assignmentId}`,
      actorToPayload(actor)
    );
  },

  async getTemplateExercises() {
    return apiGet('/exercises', { is_template: 'true' }) as Promise<
      Record<string, unknown>[]
    >;
  },

  async getExercisesByWorkoutId(workoutId: string) {
    if (!workoutId) return [];
    return apiGet('/exercises', { workout_id: workoutId }) as Promise<
      Record<string, unknown>[]
    >;
  },

  async createExercise(data: Record<string, unknown>) {
    return apiPost('/exercises', data) as Promise<Record<string, unknown>>;
  },

  async updateExercise(id: string, data: Record<string, unknown>) {
    return apiPut(`/exercises/${id}`, data) as Promise<Record<string, unknown>>;
  },

  async deleteExercise(id: string) {
    return apiDelete(`/exercises/${id}`);
  },

  async getStudents(params: Record<string, unknown> = {}) {
    const merged = { ...params, with_workout_summary: true };
    return apiGet('/students', merged as ApiParams) as Promise<
      Record<string, unknown>[]
    >;
  },

  async createStudent(data: Record<string, unknown>) {
    return apiPost('/students', data) as Promise<Record<string, unknown>>;
  },

  async getStudent(id: string) {
    return apiGet(`/students/${id}`) as Promise<Record<string, unknown>>;
  },

  async updateStudent(id: string, data: Record<string, unknown>) {
    return apiPut(`/students/${id}`, data) as Promise<Record<string, unknown>>;
  },
};
