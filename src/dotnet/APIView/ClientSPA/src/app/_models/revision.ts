import { ChangeHistory } from "./review"

export interface Revision {
  id: string
  reviewId: string
  packageName: string
  language: string
  files: File[]
  label: any
  changeHistory: ChangeHistory[]
  apiRevisionType: string
  resolvedLabel: string
  isApproved: boolean
  createdBy: string
  createdOn: string
  lastUpdatedOn: string
  isDeleted: boolean
}
  
  