export interface User { _id: string; name: string; email: string; type: 'student' | 'faculty'; roles?: string[]; mustChangePassword: boolean; isActive?: boolean; department?: string; expertiseTags?: string[]; canChair?: boolean; maxDefensesPerDay?: number; }
export interface Group { _id: string; title: string; members: User[]; adviser: User; projectArea: string; status: string; }
export interface Room { _id: string; name: string; capacity: number; equipment: string[]; }
export interface Defense { _id: string; group: Group; room: Room; chair: User; members: User[]; startTime: string; endTime: string; status: string; }
export interface Evaluation { _id: string; defense: string; panelist: User; scores: { criterion: string; score: number }[]; remarks?: string; }
