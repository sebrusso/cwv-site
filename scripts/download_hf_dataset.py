import pandas as pd
from datasets import load_dataset

def download_and_convert_to_csv():
    """
    Downloads the SAA-Lab/LitBench-Test dataset from Hugging Face,
    converts the 'train' split to a pandas DataFrame, and saves it as a CSV file.
    """
    dataset_name = "SAA-Lab/LitBench-Test"
    output_csv_file = "LitBench_Test.csv"

    try:
        print(f"Loading dataset {dataset_name} from Hugging Face...")
        # Load the dataset - this will download the parquet file
        # For gated datasets, ensure you are logged in via `huggingface-cli login`
        dataset = load_dataset(dataset_name, split="train")
        
        print("Converting dataset to pandas DataFrame...")
        df = dataset.to_pandas()

        print("Renaming columns to match Supabase schema...")
        column_mapping = {
            'chosen_story': 'chosen',
            'rejected_story': 'rejected',
            'chosen_timestamp': 'timestamp_chosen',
            'rejected_timestamp': 'timestamp_rejected',
            'chosen_upvotes': 'upvotes_chosen',
            'rejected_upvotes': 'upvotes_rejected'
        }
        df.rename(columns=column_mapping, inplace=True)

        # Columns to drop if they exist, as they are not in the current SQL schema
        columns_to_drop = ['chosen_username', 'rejected_username']
        # Only attempt to drop columns that actually exist in the DataFrame
        existing_columns_to_drop = [col for col in columns_to_drop if col in df.columns]
        if existing_columns_to_drop:
            print(f"Dropping columns not in schema: {existing_columns_to_drop}...")
            df.drop(columns=existing_columns_to_drop, inplace=True)
        
        print(f"Saving DataFrame to {output_csv_file}...")
        df.to_csv(output_csv_file, index=False)
        
        print(f"Successfully downloaded and saved dataset to {output_csv_file}")
        print(f"The CSV file contains {len(df)} rows and {len(df.columns)} columns.")

    except Exception as e:
        print(f"An error occurred: {e}")
        print("Please ensure you have the 'datasets' and 'pandas' libraries installed.")
        print("You can install them using: pip install datasets pandas pyarrow")
        print("If this is a gated dataset, make sure you are logged in using 'huggingface-cli login'.")

if __name__ == "__main__":
    download_and_convert_to_csv() 