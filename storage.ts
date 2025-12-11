import { type Complaint, type InsertComplaint, type Review, type InsertReview, complaints, reviews } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface OfficerStats {
  resolved: number;
  inProgress: number;
  workDone: number;
}

export interface IStorage {
  getAllComplaints(): Promise<Complaint[]>;
  getComplaint(id: number): Promise<Complaint | undefined>;
  createComplaint(complaint: InsertComplaint): Promise<Complaint>;
  updateComplaintStatus(id: number, status: string, officerId?: string): Promise<Complaint | undefined>;
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByComplaint(complaintId: number): Promise<Review[]>;
  getOfficerStats(officerId: string): Promise<OfficerStats>;
}

export class DatabaseStorage implements IStorage {
  async getAllComplaints(): Promise<Complaint[]> {
    return await db.select().from(complaints).orderBy(desc(complaints.createdAt));
  }

  async getComplaint(id: number): Promise<Complaint | undefined> {
    const [complaint] = await db.select().from(complaints).where(eq(complaints.id, id));
    return complaint || undefined;
  }

  async createComplaint(insertComplaint: InsertComplaint): Promise<Complaint> {
    const [complaint] = await db
      .insert(complaints)
      .values(insertComplaint)
      .returning();
    return complaint;
  }

  async updateComplaintStatus(id: number, status: string, officerId?: string): Promise<Complaint | undefined> {
    const updateData: Partial<Complaint> = { status };
    if (officerId !== undefined) {
      updateData.officerId = officerId;
    }
    
    const [updated] = await db
      .update(complaints)
      .set(updateData)
      .where(eq(complaints.id, id))
      .returning();
    
    return updated || undefined;
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = await db
      .insert(reviews)
      .values(insertReview)
      .returning();
    return review;
  }

  async getReviewsByComplaint(complaintId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.complaintId, complaintId));
  }

  async getOfficerStats(officerId: string): Promise<OfficerStats> {
    const officerComplaints = await db.select().from(complaints).where(eq(complaints.officerId, officerId));
    
    return {
      resolved: officerComplaints.filter(c => c.status === 'resolved').length,
      inProgress: officerComplaints.filter(c => c.status === 'in-progress').length,
      workDone: officerComplaints.filter(c => c.status === 'work-done').length,
    };
  }
}

export const storage = new DatabaseStorage();
