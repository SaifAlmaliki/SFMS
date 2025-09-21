
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';


const cveData = [
    { id: 'CVE-2024-12345', severity: 'High', description: 'Remote code execution vulnerability in WebServer X.', discovered: '2024-07-28' },
    { id: 'CVE-2024-67890', severity: 'Medium', description: 'Cross-site scripting (XSS) in Admin Panel.', discovered: '2024-07-27' },
    { id: 'CVE-2023-54321', severity: 'Critical', description: 'SQL injection vulnerability in database driver.', discovered: '2023-12-15' },
    { id: 'CVE-2024-11223', severity: 'Low', description: 'Information disclosure via error messages.', discovered: '2024-07-29' },
];

const mitreData = [
    { id: 'T1566', name: 'Phishing', description: 'Adversaries may send phishing messages to gain execution on victim systems.' },
    { id: 'T1059', name: 'Command and Scripting Interpreter', description: 'Adversaries may abuse command and script interpreters to execute commands.' },
    { id: 'T1078', name: 'Valid Accounts', description: 'Adversaries may obtain and abuse credentials of existing accounts as a means of gaining Initial Access, Persistence, Privilege Escalation, or Defense Evasion.' },
];

const iocData = [
    { value: '198.51.100.10', type: 'IP Address', source: 'Internal Feed', added: '2024-07-29' },
    { value: 'badsite.example.com', type: 'Domain', source: 'Third-Party', added: '2024-07-28' },
    { value: 'a1b2c3d4e5f6...', type: 'File Hash (SHA-256)', source: 'Internal Feed', added: '2024-07-27' },
]

const severityStyles = {
    'Critical': 'bg-red-700 text-white',
    'High': 'bg-red-500 text-white',
    'Medium': 'bg-yellow-500 text-white',
    'Low': 'bg-blue-500 text-white',
};

export default function ThreatIntelligencePage() {
    return (
        <div className="space-y-4">
        <h1 className="text-2xl font-bold">Threat Intelligence</h1>
        <p className="text-muted-foreground">
          Monitor threat feeds, CVEs, and Indicators of Compromise (IoCs).
        </p>
  
        <Tabs defaultValue="cve">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cve">CVEs</TabsTrigger>
            <TabsTrigger value="mitre">MITRE ATT&CK</TabsTrigger>
            <TabsTrigger value="ioc">Indicators of Compromise</TabsTrigger>
          </TabsList>
          <TabsContent value="cve">
            <Card>
              <CardHeader>
                <CardTitle>Common Vulnerabilities and Exposures (CVEs)</CardTitle>
                <CardDescription>
                  Search and browse recently discovered vulnerabilities.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex w-full max-w-sm items-center space-x-2 mb-4">
                    <Input type="text" placeholder="Search CVEs..." />
                    <Button type="submit"><Search className='h-4 w-4 mr-2' /> Search</Button>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Severity</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Discovered</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cveData.map(cve => (
                            <TableRow key={cve.id}>
                                <TableCell className='font-mono'>{cve.id}</TableCell>
                                <TableCell>
                                    <Badge className={severityStyles[cve.severity as keyof typeof severityStyles]}>{cve.severity}</Badge>
                                </TableCell>
                                <TableCell>{cve.description}</TableCell>
                                <TableCell>{cve.discovered}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="mitre">
          <Card>
              <CardHeader>
                <CardTitle>MITRE ATT&CK Framework</CardTitle>
                <CardDescription>
                  Map adversary tactics and techniques to your defenses.
                </CardDescription>
              </CardHeader>
              <CardContent>
              <div className="flex w-full max-w-sm items-center space-x-2 mb-4">
                    <Input type="text" placeholder="Search Techniques..." />
                    <Button type="submit"><Search className='h-4 w-4 mr-2' /> Search</Button>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mitreData.map(tactic => (
                            <TableRow key={tactic.id}>
                                <TableCell className='font-mono'>{tactic.id}</TableCell>
                                <TableCell>{tactic.name}</TableCell>
                                <TableCell>{tactic.description}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="ioc">
          <Card>
              <CardHeader>
                <CardTitle>Indicators of Compromise (IoCs)</CardTitle>
                <CardDescription>
                  Manage and ingest IoCs from various threat intelligence feeds.
                </CardDescription>
              </CardHeader>
              <CardContent>
              <div className="flex w-full max-w-sm items-center space-x-2 mb-4">
                    <Input type="text" placeholder="Search IoCs..." />
                    <Button type="submit"><Search className='h-4 w-4 mr-2' /> Search</Button>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Value</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Date Added</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {iocData.map(ioc => (
                            <TableRow key={ioc.value}>
                                <TableCell className='font-mono'>{ioc.value}</TableCell>
                                <TableCell>{ioc.type}</TableCell>
                                <TableCell>{ioc.source}</TableCell>
                                <TableCell>{ioc.added}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }
