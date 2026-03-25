import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'coffee-note.db');

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDb(db);
  }
  return db;
}

function initializeDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bean_name TEXT NOT NULL,
      roastery TEXT NOT NULL,
      blend_type TEXT NOT NULL CHECK(blend_type IN ('seasonal', 'signature', 'other')),
      is_default INTEGER NOT NULL DEFAULT 0,

      hot_dose_min REAL,
      hot_dose_max REAL,
      hot_temp_min REAL,
      hot_temp_max REAL,
      hot_method TEXT NOT NULL DEFAULT 'manual',
      hot_steps TEXT,
      hot_water_add_min REAL,
      hot_water_add_max REAL,
      hot_stir_steps TEXT,

      iced_dose_min REAL,
      iced_dose_max REAL,
      iced_temp_min REAL,
      iced_temp_max REAL,
      iced_method TEXT NOT NULL DEFAULT 'manual',
      iced_steps TEXT,
      iced_water_add_min REAL,
      iced_water_add_max REAL,
      iced_stir_steps TEXT,

      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL,
      brew_type TEXT NOT NULL CHECK(brew_type IN ('hot', 'iced')),
      brew_date TEXT NOT NULL,
      dose REAL,
      water_temp REAL,
      steps TEXT,
      total_amount REAL,
      rating INTEGER CHECK(rating >= 1 AND rating <= 5),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );
  `);

  // Seed default recipes if none exist
  const count = db.prepare('SELECT COUNT(*) as cnt FROM recipes WHERE is_default = 1').get() as { cnt: number };
  if (count.cnt === 0) {
    seedDefaultRecipes(db);
  }
}

function seedDefaultRecipes(db: Database.Database) {
  const insert = db.prepare(`
    INSERT INTO recipes (
      bean_name, roastery, blend_type, is_default,
      hot_dose_min, hot_dose_max, hot_temp_min, hot_temp_max, hot_method, hot_steps, hot_water_add_min, hot_water_add_max, hot_stir_steps,
      iced_dose_min, iced_dose_max, iced_temp_min, iced_temp_max, iced_method, iced_steps, iced_water_add_min, iced_water_add_max, iced_stir_steps
    ) VALUES (
      @bean_name, @roastery, @blend_type, 1,
      @hot_dose_min, @hot_dose_max, @hot_temp_min, @hot_temp_max, @hot_method, @hot_steps, @hot_water_add_min, @hot_water_add_max, @hot_stir_steps,
      @iced_dose_min, @iced_dose_max, @iced_temp_min, @iced_temp_max, @iced_method, @iced_steps, @iced_water_add_min, @iced_water_add_max, @iced_stir_steps
    )
  `);

  const recipes = [
    {
      bean_name: '가을온기', roastery: '모모스(MOMOS)', blend_type: 'seasonal',
      hot_dose_min: 16, hot_dose_max: 18, hot_temp_min: 94, hot_temp_max: 97,
      hot_method: 'x3rule', hot_steps: null, hot_water_add_min: 45, hot_water_add_max: 60, hot_stir_steps: '["0"]',
      iced_dose_min: 22, iced_dose_max: 22, iced_temp_min: 90, iced_temp_max: 100,
      iced_method: 'manual', iced_steps: '[{"label":"블루밍·교반","amount":40},{"label":"추출1","amount":80},{"label":"추출2","amount":130},{"label":"추출3","amount":180},{"label":"추출4(최종)","amount":220}]',
      iced_water_add_min: null, iced_water_add_max: null, iced_stir_steps: '["0"]',
    },
    {
      bean_name: '겨울 툰드라', roastery: '모모스(MOMOS)', blend_type: 'seasonal',
      hot_dose_min: 16, hot_dose_max: 18, hot_temp_min: 94, hot_temp_max: 97,
      hot_method: 'x3rule', hot_steps: null, hot_water_add_min: 45, hot_water_add_max: 60, hot_stir_steps: '["0"]',
      iced_dose_min: 22, iced_dose_max: 22, iced_temp_min: 97, iced_temp_max: 100,
      iced_method: 'manual', iced_steps: '[{"label":"블루밍·교반","amount":40},{"label":"추출1","amount":80},{"label":"추출2","amount":130},{"label":"추출3","amount":180},{"label":"추출4(최종)","amount":220}]',
      iced_water_add_min: null, iced_water_add_max: null, iced_stir_steps: '["0"]',
    },
    {
      bean_name: '에스쇼콜라', roastery: '모모스(MOMOS)', blend_type: 'signature',
      hot_dose_min: 20, hot_dose_max: 20, hot_temp_min: 93, hot_temp_max: 95,
      hot_method: 'manual', hot_steps: '[{"label":"블루밍·교반","amount":40},{"label":"추출1","amount":160}]',
      hot_water_add_min: 150, hot_water_add_max: 180, hot_stir_steps: '["0","1"]',
      iced_dose_min: 20, iced_dose_max: 20, iced_temp_min: 93, iced_temp_max: 95,
      iced_method: 'manual', iced_steps: '[{"label":"블루밍·교반","amount":40},{"label":"추출1(최종)","amount":140}]',
      iced_water_add_min: null, iced_water_add_max: null, iced_stir_steps: '["0"]',
    },
    {
      bean_name: '부산 블랜드', roastery: '모모스(MOMOS)', blend_type: 'signature',
      hot_dose_min: 20, hot_dose_max: 20, hot_temp_min: 93, hot_temp_max: 95,
      hot_method: 'manual', hot_steps: '[{"label":"블루밍·교반","amount":40},{"label":"추출1","amount":80},{"label":"추출2","amount":130},{"label":"추출3","amount":160}]',
      hot_water_add_min: 130, hot_water_add_max: 150, hot_stir_steps: '["0","3"]',
      iced_dose_min: 20, iced_dose_max: 20, iced_temp_min: 93, iced_temp_max: 95,
      iced_method: 'manual', iced_steps: '[{"label":"블루밍·교반","amount":40},{"label":"추출1(최종)","amount":140}]',
      iced_water_add_min: null, iced_water_add_max: null, iced_stir_steps: '["0"]',
    },
    {
      bean_name: '푸루티봉봉', roastery: '모모스(MOMOS)', blend_type: 'signature',
      hot_dose_min: 14, hot_dose_max: 18, hot_temp_min: 94, hot_temp_max: 95,
      hot_method: 'x3rule', hot_steps: null, hot_water_add_min: 45, hot_water_add_max: 60, hot_stir_steps: '["0"]',
      iced_dose_min: 22, iced_dose_max: 22, iced_temp_min: 97, iced_temp_max: 100,
      iced_method: 'manual', iced_steps: '[{"label":"블루밍·교반","amount":40},{"label":"추출1","amount":80},{"label":"추출2","amount":130},{"label":"추출3","amount":180},{"label":"추출4(최종)","amount":220}]',
      iced_water_add_min: null, iced_water_add_max: null, iced_stir_steps: '["0"]',
    },
    {
      bean_name: '모쵸베리 블랜드', roastery: '모모스(MOMOS)', blend_type: 'signature',
      hot_dose_min: 16, hot_dose_max: 18, hot_temp_min: 94, hot_temp_max: 97,
      hot_method: 'x3rule', hot_steps: null, hot_water_add_min: 45, hot_water_add_max: 60, hot_stir_steps: '["0"]',
      iced_dose_min: 22, iced_dose_max: 22, iced_temp_min: 97, iced_temp_max: 100,
      iced_method: 'manual', iced_steps: '[{"label":"블루밍·교반","amount":40},{"label":"추출1","amount":80},{"label":"추출2","amount":130},{"label":"추출3","amount":180},{"label":"추출4(최종)","amount":220}]',
      iced_water_add_min: null, iced_water_add_max: null, iced_stir_steps: '["0"]',
    },
  ];

  const insertMany = db.transaction(() => {
    for (const recipe of recipes) {
      insert.run(recipe);
    }
  });
  insertMany();
}

export default getDb;
