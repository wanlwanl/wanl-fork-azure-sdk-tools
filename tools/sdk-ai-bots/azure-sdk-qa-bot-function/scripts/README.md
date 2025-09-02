# Update feedbacks and conversation records table
The scripts in this folder update the feedbacks and conversation records from azure blob to azure table for analytics API before RAG backend support saving data in azure table.

## Steps to update in azure table
1. clean up azure tables `ConversationRecord` and `Feedback`
2. download all excel files from blobs contains `records` and `feedback-v2` into different folders
3. install runner tool `npm install -g tsx`
4. run `az login`
5. run `tsx add-conversation-record-to-azure-table.ts <folder-to-conversation-excels>`, enter to confirm to update data into azure table
6. run `tsx add-feedback-to-azure-table.ts <folder-to-conversation-excels>`, enter to confirm to update data into azure table
