import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: ['../projects/shared/src/lib/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
  docs: {},
};

export default config;
