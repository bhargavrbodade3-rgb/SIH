import sqlite3
import os

def migrate():
    db_path = "compliance_platform.db"
    if not os.path.exists(db_path):
        print("Database not found at", db_path)
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    def add_col_if_missing(table, col, col_type, default_val=None):
        cursor.execute(f"PRAGMA table_info({table})")
        existing = [r[1] for r in cursor.fetchall()]
        if col not in existing:
            sql = f"ALTER TABLE {table} ADD COLUMN {col} {col_type}"
            if default_val is not None:
                sql += f" DEFAULT {default_val}"
            print(f"Adding {col} to {table}...")
            cursor.execute(sql)
            conn.commit()

    # businesses table updates
    add_col_if_missing("businesses", "premises_type", "VARCHAR(50)", "'RENTED'")
    add_col_if_missing("businesses", "electricity_load_kw", "VARCHAR(50)", "NULL")
    add_col_if_missing("businesses", "water_usage_lpd", "VARCHAR(50)", "NULL")
    add_col_if_missing("businesses", "food_handling", "BOOLEAN", "0")
    add_col_if_missing("businesses", "manufacturing_activity", "BOOLEAN", "1")
    add_col_if_missing("businesses", "construction_activity", "BOOLEAN", "0")
    add_col_if_missing("businesses", "storage_activity", "BOOLEAN", "0")
    add_col_if_missing("businesses", "logistics_activity", "BOOLEAN", "0")
    add_col_if_missing("businesses", "sector_answers", "TEXT", "NULL")

    # Update business 1 default premises_type
    cursor.execute("UPDATE businesses SET premises_type = 'RENTED' WHERE premises_type IS NULL")
    conn.commit()

    print("DB migration completed successfully!")
    conn.close()

if __name__ == "__main__":
    migrate()
