/**
 * Content types that can be searched within XML
 */
export type ContentType =
  | 'ELEMENT_CONTENT'
  | 'ATTRIBUTE_VALUES'
  | 'ELEMENT_NAMES'
  | 'ATTRIBUTE_NAMES'
  | 'CDATA_SECTIONS'
  | 'COMMENTS'
  | 'PROCESSING_INSTRUCTIONS'
  | 'DOCTYPE_DECLARATIONS'
  | 'ENTITIES';

/**
 * XML-specific search options
 * Controls where within the XML structure to search
 */
export interface XmlFindOptions {
  /**
   * Content types to search within
   * Examples:
   * - ELEMENT_CONTENT: Text between tags <p>search here</p>
   * - ATTRIBUTE_VALUES: Attribute values <p id="search here">
   * - ELEMENT_NAMES: Element names <searchHere>
   * - ATTRIBUTE_NAMES: Attribute names <p searchHere="value">
   */
  contentTypes?: ContentType[];

  /**
   * XPath restriction to narrow search scope
   * Optional: limits search to elements matching this XPath
   */
  xpathRestriction?: string;
}

/**
 * Search criteria configuration
 * Defines what to search for and how to interpret the pattern
 */
export interface FindCriteria {
  /** Search pattern or text to find (required, min length 1) */
  pattern: string;

  /** If true, interpret pattern as regular expression */
  regex?: boolean;

  /** XML-specific search options */
  xmlFindOptions?: XmlFindOptions;

  /** Case sensitive matching (default: false) */
  caseSensitive?: boolean;

  /** Match whole words only (default: false) */
  wholeWordsOnly?: boolean;

  /** Ignore whitespace in matches (default: false) */
  ignoreWhitespace?: boolean;

  /** In regex mode, make . match newlines (default: false) */
  dotMatchesAll?: boolean;

  /** Use canonical equivalence for Unicode matching (default: false) */
  canonicalEquivalence?: boolean;

  /** Enable XML-aware searching (default: false) */
  xmlAware?: boolean;
}

/**
 * @deprecated Use FindCriteria instead. This alias maintained for backwards compatibility.
 */
export type SearchCriteria = FindCriteria;
