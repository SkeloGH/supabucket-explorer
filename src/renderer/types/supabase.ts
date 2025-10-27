export interface Bucket {
  id: string; // The slug/identifier used in API calls
  name: string; // The display name
  owner: string;
  public: boolean;
  type: string;
  file_size_limit: number | null;
  allowed_mime_types: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface FileItem {
  name: string;
  id: string | null;
  updated_at: string | null;
  created_at: string | null;
  last_accessed_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface SelectedFile {
  bucket: string;
  path: string;
  isFolder: boolean;
}

