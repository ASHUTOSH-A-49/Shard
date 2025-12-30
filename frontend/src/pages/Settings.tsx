import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Palette, 
  Sliders, 
  Bell, 
  Key, 
  Database,
  Save,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useThemeStore } from '@/store/themeStore';
import { toast } from 'sonner';

export default function Settings() {
  const { theme, setTheme } = useThemeStore();
  const [autoApproveThreshold, setAutoApproveThreshold] = useState([95]);
  const [confidenceWarning, setConfidenceWarning] = useState([70]);
  const [duplicateDetection, setDuplicateDetection] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const handleSave = () => {
    toast.success('Settings saved successfully!');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and application preferences
        </p>
      </motion.div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="w-4 h-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="processing">
            <Sliders className="w-4 h-4 mr-2" />
            Processing
          </TabsTrigger>
          {/* <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
           Notifications
          </TabsTrigger> */}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue="not entered" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue="not entered" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="your gmail" />
                </div>
                {/* <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" defaultValue="HackXios 2K25" />
                </div> */}
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>Choose your preferred color scheme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setTheme('light')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      theme === 'light' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <Sun className="w-6 h-6 mx-auto mb-2 text-warning" />
                    <p className="font-medium text-foreground">Light</p>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setTheme('dark')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <Moon className="w-6 h-6 mx-auto mb-2 text-info" />
                    <p className="font-medium text-foreground">Dark</p>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-4 rounded-xl border-2 border-border opacity-50 cursor-not-allowed"
                  >
                    <Monitor className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="font-medium text-foreground">System</p>
                    <p className="text-xs text-muted-foreground">Coming soon</p>
                  </motion.button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Processing Tab */}
        <TabsContent value="processing">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Auto-Approve Threshold</CardTitle>
                <CardDescription>
                  Invoices with confidence above this threshold will be auto-approved
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Slider
                    value={autoApproveThreshold}
                    onValueChange={setAutoApproveThreshold}
                    min={80}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-lg font-semibold text-primary w-16 text-right">
                    {autoApproveThreshold}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Confidence Warning Threshold</CardTitle>
                <CardDescription>
                  Fields below this confidence will be flagged for review
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Slider
                    value={confidenceWarning}
                    onValueChange={setConfidenceWarning}
                    min={50}
                    max={90}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-lg font-semibold text-warning w-16 text-right">
                    {confidenceWarning}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Duplicate Detection</CardTitle>
                <CardDescription>
                  Automatically detect and flag potential duplicate invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Enable Detection</p>
                    <p className="text-sm text-muted-foreground">
                      Compare against last 90 days of invoices
                    </p>
                  </div>
                  <Switch
                    checked={duplicateDetection}
                    onCheckedChange={setDuplicateDetection}
                  />
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSave}>
              <Save className="w-4 h-4" />
              Save Processing Settings
            </Button>
          </motion.div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive daily digest of invoice processing
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Low Confidence Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when invoices need manual review
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Processing Complete</p>
                    <p className="text-sm text-muted-foreground">
                      Notification when batch processing finishes
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Weekly Reports</p>
                    <p className="text-sm text-muted-foreground">
                      Receive weekly analytics summary
                    </p>
                  </div>
                  <Switch />
                </div>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4" />
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
