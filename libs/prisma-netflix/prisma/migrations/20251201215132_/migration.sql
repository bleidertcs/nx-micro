-- CreateTable
CREATE TABLE "netflix_shows" (
    "show_id" TEXT NOT NULL,
    "type" TEXT,
    "title" TEXT,
    "director" TEXT,
    "cast_members" TEXT,
    "country" TEXT,
    "date_added" DATE,
    "release_year" INTEGER,
    "rating" TEXT,
    "duration" TEXT,
    "listed_in" TEXT,
    "description" TEXT,

    CONSTRAINT "netflix_shows_pkey" PRIMARY KEY ("show_id")
);
