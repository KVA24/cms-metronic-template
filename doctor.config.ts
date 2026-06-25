export default ({
  ignore: {
    files: [
      // Dependencies
      '**/node_modules/**',
      
      // Build output
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/out/**',
      '**/coverage/**',
      
      // Legacy code
      'src/shared/**',
      'src/widgets/**',
      
      // Assets
      '**/public/**',
      '**/assets/**',
      
      // Types only
      '**/*.d.ts',
      
      // Vendor / third-party source
      'src/vendor/**',
      
      // Temporary
      '**/tmp/**',
      '**/temp/**',
    ],
  },
});