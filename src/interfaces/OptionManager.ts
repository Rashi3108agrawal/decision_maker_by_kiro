import { Option, ValidationResult } from '../types/core';

export interface OptionManager {
  addOption(option: Omit<Option, 'id'>): Promise<Option>;
  updateOption(id: string, updates: Partial<Option>): Promise<Option>;
  removeOption(id: string): Promise<void>;
  validateOption(option: Option): ValidationResult;
  getOption(id: string): Promise<Option | null>;
  getAllOptions(): Promise<Option[]>;
}