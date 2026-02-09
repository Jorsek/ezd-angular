/**
 * Represents a DITA resource file in the CCMS.
 */
export interface Resource {
  resourceUuid: string;
  branchName: string;
  resourceCreateTime: string;
  path: string;
  ezdPath: string;
  fileName: string;
  uuid: string;
  directoryUuid: string;
  ownerUsername: string;
  creatorUsername: string;
  lastModified: string;
  contentMimeType: string;
  metadata: ResourceMetadata;
  permOwner: string;
  ownerGroup: string;
  mode: string;
  contentHashMd5: string;
  contentHashSha256: string;
}

/**
 * Metadata associated with a resource file.
 */
export interface ResourceMetadata {
  title?: string;
  status?: string;
  checksum?: string;
  'is-valid'?: string;
  'char-count'?: string;
  'dita-class'?: string;
  'lock-owner'?: string;
  'word-count'?: string;
  'content-type'?: string;
  'dita-domains'?: string;
  __in_a_release?: string;
  '__checksum-dirty'?: string;
  __document_owner?: string;
  'num-open-comments'?: string;
  __has_broken_links?: string;
  __last_modified_by?: string;
  'validation-err-msg'?: string;
  'normalized-checksum'?: string;
  '__root-resource-uuid'?: string;
  'document-valid-md-field'?: string;
  __last_modified_revision?: string;
  __document_links_last_processed_rev?: string;
  [key: string]: string | undefined; // Allow additional metadata fields
}
