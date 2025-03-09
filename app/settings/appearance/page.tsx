'use client';

import SettingsLayout from '../../components/SettingsLayout';
import FormField from '../../components/FormField';
import Button from '../../components/Button';

export default function AppearanceSettingsPage() {
  return (
    <SettingsLayout activeSection="appearance">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-white mb-6">Appearance Settings</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Theme</h2>
          
          <form>
            <FormField
              label="Theme Mode"
              htmlFor="theme"
              description="Choose between light and dark mode for the application."
            >
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    defaultChecked
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-600 bg-gray-700"
                  />
                  <span className="ml-2 text-white">Dark</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-600 bg-gray-700"
                  />
                  <span className="ml-2 text-white">Light</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="theme"
                    value="system"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-600 bg-gray-700"
                  />
                  <span className="ml-2 text-white">System</span>
                </label>
              </div>
            </FormField>
            
            <FormField
              label="Accent Color"
              htmlFor="accentColor"
              description="Choose the accent color for buttons and interactive elements."
            >
              <div className="flex space-x-4">
                <label className="flex flex-col items-center space-y-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 cursor-pointer ring-2 ring-offset-2 ring-offset-gray-800 ring-white"></div>
                  <input
                    type="radio"
                    name="accentColor"
                    value="indigo"
                    defaultChecked
                    className="sr-only"
                  />
                  <span className="text-xs text-gray-400">Indigo</span>
                </label>
                <label className="flex flex-col items-center space-y-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 cursor-pointer"></div>
                  <input
                    type="radio"
                    name="accentColor"
                    value="blue"
                    className="sr-only"
                  />
                  <span className="text-xs text-gray-400">Blue</span>
                </label>
                <label className="flex flex-col items-center space-y-2">
                  <div className="w-8 h-8 rounded-full bg-green-600 cursor-pointer"></div>
                  <input
                    type="radio"
                    name="accentColor"
                    value="green"
                    className="sr-only"
                  />
                  <span className="text-xs text-gray-400">Green</span>
                </label>
                <label className="flex flex-col items-center space-y-2">
                  <div className="w-8 h-8 rounded-full bg-purple-600 cursor-pointer"></div>
                  <input
                    type="radio"
                    name="accentColor"
                    value="purple"
                    className="sr-only"
                  />
                  <span className="text-xs text-gray-400">Purple</span>
                </label>
                <label className="flex flex-col items-center space-y-2">
                  <div className="w-8 h-8 rounded-full bg-pink-600 cursor-pointer"></div>
                  <input
                    type="radio"
                    name="accentColor"
                    value="pink"
                    className="sr-only"
                  />
                  <span className="text-xs text-gray-400">Pink</span>
                </label>
              </div>
            </FormField>
            
            <FormField
              label="Density"
              htmlFor="density"
              description="Control the spacing and density of the user interface."
            >
              <select
                id="density"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                defaultValue="comfortable"
              >
                <option value="compact">Compact</option>
                <option value="comfortable">Comfortable</option>
                <option value="spacious">Spacious</option>
              </select>
            </FormField>
            
            <FormField
              label="Font Size"
              htmlFor="fontSize"
              description="Adjust the font size across the application."
            >
              <select
                id="fontSize"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                defaultValue="medium"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </FormField>
            
            <div className="mt-8 flex justify-end">
              <Button type="submit">
                Save Appearance
              </Button>
            </div>
          </form>
        </div>
      </div>
    </SettingsLayout>
  );
} 