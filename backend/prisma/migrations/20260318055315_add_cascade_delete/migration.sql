-- DropForeignKey
ALTER TABLE "DocumentCollaborator" DROP CONSTRAINT "DocumentCollaborator_documentId_fkey";

-- AddForeignKey
ALTER TABLE "DocumentCollaborator" ADD CONSTRAINT "DocumentCollaborator_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
