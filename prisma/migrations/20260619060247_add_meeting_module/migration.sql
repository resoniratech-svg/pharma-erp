-- CreateTable
CREATE TABLE "MeetingDoctor" (
    "id" SERIAL NOT NULL,
    "meetingId" INTEGER NOT NULL,
    "doctorId" INTEGER NOT NULL,

    CONSTRAINT "MeetingDoctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingChemist" (
    "id" SERIAL NOT NULL,
    "meetingId" INTEGER NOT NULL,
    "chemistId" INTEGER NOT NULL,

    CONSTRAINT "MeetingChemist_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MeetingDoctor" ADD CONSTRAINT "MeetingDoctor_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingDoctor" ADD CONSTRAINT "MeetingDoctor_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingChemist" ADD CONSTRAINT "MeetingChemist_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingChemist" ADD CONSTRAINT "MeetingChemist_chemistId_fkey" FOREIGN KEY ("chemistId") REFERENCES "Chemist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
