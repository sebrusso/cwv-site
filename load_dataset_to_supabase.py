#!/usr/bin/env python3
"""
Script to load writingprompts_pairwise_test.csv data into the Supabase database.
This populates the "writingprompts-pairwise-test" table with your dataset.
"""

import pandas as pd
import os
from supabase import create_client, Client
from dotenv import load_dotenv
import uuid

# Load environment variables
load_dotenv('.env.local')

def load_csv_to_supabase():
    """Load the CSV dataset into Supabase"""
    
    # Initialize Supabase client
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_KEY')  # Use service key for admin operations
    
    if not supabase_url or not supabase_key:
        print("Error: Missing Supabase environment variables")
        print("Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are set in .env.local")
        return
    
    supabase: Client = create_client(supabase_url, supabase_key)
    
    # Read the CSV file
    csv_file = 'writingprompts_pairwise_test.csv'
    if not os.path.exists(csv_file):
        print(f"Error: {csv_file} not found")
        return
    
    print(f"Reading {csv_file}...")
    df = pd.read_csv(csv_file)
    print(f"Loaded {len(df)} rows")
    
    # Convert DataFrame to list of dictionaries for Supabase
    records = []
    for _, row in df.iterrows():
        # Helper function to safely convert to int
        def safe_int(value):
            try:
                if pd.notna(value) and value != '' and str(value).lower() != 'nan':
                    return int(float(value))  # Convert through float first to handle decimal strings
                return None
            except (ValueError, TypeError):
                return None
        
        # Helper function to safely convert to string
        def safe_str(value):
            if pd.notna(value) and str(value).lower() != 'nan':
                return str(value)
            return None
        
        # Helper function to convert Unix timestamp to ISO format
        def safe_timestamp(value):
            try:
                if pd.notna(value) and value != '' and str(value).lower() != 'nan':
                    # Convert Unix timestamp to datetime and then to ISO format
                    import datetime
                    timestamp = float(value)
                    dt = datetime.datetime.fromtimestamp(timestamp, tz=datetime.timezone.utc)
                    return dt.isoformat()
                return None
            except (ValueError, TypeError, OSError):
                return None
        
        # Skip rows without prompts (required field)
        prompt = safe_str(row['prompt'])
        if not prompt:
            continue
            
        record = {
            'id': str(uuid.uuid4()),  # Generate UUID for each record
            'prompt': prompt,
            'chosen': safe_str(row['chosen']),
            'rejected': safe_str(row['rejected']),
            'timestamp_chosen': safe_timestamp(row['timestamp_chosen']),
            'timestamp_rejected': safe_timestamp(row['timestamp_rejected']),
            'upvotes_chosen': safe_int(row['upvotes_chosen']),
            'upvotes_rejected': safe_int(row['upvotes_rejected']),
        }
        records.append(record)
    
    # Insert data in batches (Supabase has limits)
    batch_size = 1000
    total_inserted = 0
    
    print("Inserting data into Supabase...")
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        try:
            result = supabase.table('writingprompts-pairwise-test').insert(batch).execute()
            total_inserted += len(batch)
            print(f"Inserted batch {i//batch_size + 1}: {len(batch)} records (Total: {total_inserted})")
        except Exception as e:
            print(f"Error inserting batch {i//batch_size + 1}: {e}")
            return
    
    print(f"Successfully inserted {total_inserted} records into writingprompts-pairwise-test table")

if __name__ == "__main__":
    load_csv_to_supabase() 