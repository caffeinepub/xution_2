import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Facility {
    id: string;
    status: FacilityStatus;
    name: string;
    createdAt: bigint;
    description: string;
    location: string;
}
export interface Policy {
    id: string;
    title: string;
    active: boolean;
    content: string;
    createdAt: bigint;
    updatedAt: bigint;
    category: string;
}
export interface Broadcast {
    id: string;
    title: string;
    content: string;
    authorId: string;
    createdAt: bigint;
    priority: BroadcastPriority;
}
export interface Transaction {
    id: string;
    memberId: string;
    createdAt: bigint;
    type: TransactionType;
    description: string;
    facilityId?: string;
    amount: bigint;
}
export interface SessionData {
    memberId?: string;
    sessionType: string;
    createdAt: bigint;
}
export interface DM {
    id: string;
    content: string;
    read: boolean;
    sentAt: bigint;
    toMemberId: string;
    fromMemberId: string;
}
export interface Member {
    id: string;
    status: Status;
    principal: Principal;
    name: string;
    joinedAt: bigint;
    role: Role;
    email: string;
    idCardImage?: string;
}
export interface UserProfile {
    memberId?: string;
    name: string;
}
export enum BroadcastPriority {
    normal = "normal",
    high = "high",
    urgent = "urgent"
}
export enum FacilityStatus {
    available = "available",
    maintenance = "maintenance",
    inUse = "inUse"
}
export enum Role {
    member = "member",
    admin = "admin"
}
export enum Status {
    active = "active",
    inactive = "inactive",
    suspended = "suspended"
}
export enum TransactionType {
    fee = "fee",
    donation = "donation",
    payment = "payment",
    refund = "refund"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addFacility(id: string, name: string, description: string, location: string): Promise<void>;
    addPolicy(id: string, title: string, content: string, category: string): Promise<void>;
    addTransaction(id: string, memberId: string, facilityId: string | null, amount: bigint, description: string, type: TransactionType): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createBroadcast(id: string, title: string, content: string, authorId: string, priority: BroadcastPriority): Promise<void>;
    createMember(id: string, name: string, email: string, role: Role, principal: Principal): Promise<void>;
    createSession(token: string, sessionType: string, memberId: string | null): Promise<void>;
    deactivatePolicy(id: string): Promise<void>;
    deleteMember(id: string): Promise<void>;
    destroySession(token: string): Promise<void>;
    getAboutText(): Promise<string>;
    getAllBroadcasts(): Promise<Array<Broadcast>>;
    getAllDMs(): Promise<Array<DM>>;
    getAllFacilities(): Promise<Array<Facility>>;
    getAllMembers(): Promise<Array<Member>>;
    getAllPolicies(): Promise<Array<Policy>>;
    getAllTransactions(): Promise<Array<Transaction>>;
    getBroadcast(id: string): Promise<Broadcast>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDM(id: string): Promise<DM>;
    getFacility(id: string): Promise<Facility>;
    getFeaturesList(): Promise<Array<string>>;
    getMember(id: string): Promise<Member>;
    getMemberByQrId(qrId: string): Promise<Member | null>;
    getPasswords(): Promise<[string, string]>;
    getPolicy(id: string): Promise<Policy>;
    getTransaction(id: string): Promise<Transaction>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markDMAsRead(id: string): Promise<void>;
    removeFacility(id: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendDM(fromMemberId: string, toMemberId: string, content: string): Promise<void>;
    setMemberIdCard(memberId: string, imageDataUrl: string): Promise<void>;
    setPasswords(p1: string, p2: string): Promise<void>;
    updateAboutText(newText: string): Promise<void>;
    updateFacilityStatus(id: string, status: FacilityStatus): Promise<void>;
    updateFeaturesList(newFeatures: Array<string>): Promise<void>;
    updateMember(id: string, name: string, email: string, role: Role): Promise<void>;
    updatePolicy(id: string, title: string, content: string): Promise<void>;
    validateSession(token: string): Promise<SessionData | null>;
    verifyPassword(pw: string): Promise<boolean>;
}
