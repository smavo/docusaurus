/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs from 'fs-extra';
import importFresh from 'import-fresh';
import type {SidebarsConfig, Sidebars, NormalizedSidebars} from './types';
import type {PluginOptions} from '../types';
import {validateSidebars} from './validation';
import {normalizeSidebars} from './normalization';
import {processSidebars, SidebarProcessorProps} from './processor';
import path from 'path';

export const DefaultSidebars: SidebarsConfig = {
  defaultSidebar: [
    {
      type: 'autogenerated',
      dirName: '.',
    },
  ],
};

export const DisabledSidebars: SidebarsConfig = {};

// If a path is provided, make it absolute
// use this before loadSidebars()
export function resolveSidebarPathOption(
  siteDir: string,
  sidebarPathOption: PluginOptions['sidebarPath'],
): PluginOptions['sidebarPath'] {
  return sidebarPathOption
    ? path.resolve(siteDir, sidebarPathOption)
    : sidebarPathOption;
}

function loadSidebarFile(
  sidebarFilePath: string | false | undefined,
): SidebarsConfig {
  // false => no sidebars
  if (sidebarFilePath === false) {
    return DisabledSidebars;
  }

  // undefined => defaults to autogenerated sidebars
  if (typeof sidebarFilePath === 'undefined') {
    return DefaultSidebars;
  }

  // Non-existent sidebars file: no sidebars
  // Note: this edge case can happen on versioned docs, not current version
  // We avoid creating empty versioned sidebars file with the CLI
  if (!fs.existsSync(sidebarFilePath)) {
    return DisabledSidebars;
  }

  // We don't want sidebars to be cached because of hot reloading.
  return importFresh(sidebarFilePath);
}

export function loadUnprocessedSidebars(
  sidebarFilePath: string | false | undefined,
  options: SidebarProcessorProps['options'],
): NormalizedSidebars {
  const sidebarsConfig = loadSidebarFile(sidebarFilePath);
  validateSidebars(sidebarsConfig);

  const normalizedSidebars = normalizeSidebars(sidebarsConfig, options);
  return normalizedSidebars;
}

// Note: sidebarFilePath must be absolute, use resolveSidebarPathOption
export async function loadSidebars(
  sidebarFilePath: string | false | undefined,
  options: SidebarProcessorProps,
): Promise<Sidebars> {
  const unprocessedSidebars = loadUnprocessedSidebars(
    sidebarFilePath,
    options.options,
  );
  return processSidebars(unprocessedSidebars, options);
}