export interface ProjectTemplate {
  name: string;
  framework: string;
  dependencies: {
    required: Record<string, string>;
    dev: Record<string, string>;
  };
  structure: TemplateFile[];
  configs: ConfigFile[];
  scripts?: Record<string, string>;
}

export interface TemplateFile {
  path: string;
  template: string;
  condition?: string; // e.g., "hasAuth", "hasDatabase"
}

export interface ConfigFile {
  name: string;
  template: string;
}

export interface FeatureTemplate {
  name: string;
  dependencies: string[];
  devDependencies?: string[];
  structure: TemplateFile[];
  scripts?: Record<string, string>;
  envVars?: string[];
}

export interface InitProjectInput {
  framework: string;
  name: string;
  path: string;
  features?: string[];
  typescript?: boolean;
}

export interface GeneratedProject {
  path: string;
  files: string[];
  nextSteps: string[];
}
