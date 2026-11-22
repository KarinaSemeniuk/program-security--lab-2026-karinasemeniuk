CREATE TYPE resource_type AS ENUM ('ROOM', 'DESK');
ALTER TABLE resources ADD COLUMN type resource_type NOT NULL DEFAULT 'ROOM',
  ADD COLUMN description TEXT NOT NULL DEFAULT '',
  ADD COLUMN location VARCHAR(200) NOT NULL DEFAULT '',
  ADD COLUMN equipment TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN revision INTEGER NOT NULL DEFAULT 0;
ALTER TABLE resources ADD CONSTRAINT resource_revision_nonnegative CHECK (revision >= 0);
-- Initialize only newly introduced fields on the three known sample resources.
UPDATE resources SET description = 'Простір для командних зустрічей, обговорень і презентацій.', location = 'Перший поверх · зона зустрічей', equipment = ARRAY['Wi-Fi','Екран','Маркерна дошка'] WHERE id = 'b0000000-0000-4000-8000-000000000001';
UPDATE resources SET description = 'Тиха кімната для зосередженої роботи та розмов удвох.', location = 'Другий поверх · тиха зона', equipment = ARRAY['Wi-Fi','Розетки','Настільне освітлення'] WHERE id = 'b0000000-0000-4000-8000-000000000002';
UPDATE resources SET type = 'DESK', description = 'Індивідуальне робоче місце з природним освітленням.', location = 'Другий поверх · відкритий простір', equipment = ARRAY['Wi-Fi','Розетки','Регульоване крісло'] WHERE id = 'b0000000-0000-4000-8000-000000000003';
