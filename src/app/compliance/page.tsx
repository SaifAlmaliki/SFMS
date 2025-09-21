import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const complianceReports = [
  {
    framework: 'PCI DSS',
    status: 'Compliant',
    lastAudit: '2024-05-20',
    coverage: 98,
  },
  {
    framework: 'HIPAA',
    status: 'Compliant',
    lastAudit: '2024-04-15',
    coverage: 100,
  },
  {
    framework: 'GDPR',
    status: 'Needs Review',
    lastAudit: '2024-06-01',
    coverage: 85,
  },
  {
    framework: 'ISO 27001',
    status: 'Non-Compliant',
    lastAudit: '2024-03-10',
    coverage: 60,
  },
];

const statusStyles = {
  Compliant: 'bg-accent text-accent-foreground',
  'Needs Review': 'bg-yellow-500 text-white',
  'Non-Compliant': 'bg-destructive text-destructive-foreground',
};

export default function CompliancePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Compliance Management</h1>
      <p className="text-muted-foreground">
        Track your compliance status against various security frameworks.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Compliance Status</CardTitle>
          <CardDescription>
            Overview of compliance with different regulations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Framework</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Audit</TableHead>
                <TableHead className="text-right">Coverage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complianceReports.map((report) => (
                <TableRow key={report.framework}>
                  <TableCell className="font-medium">
                    {report.framework}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusStyles[report.status]}>
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{report.lastAudit}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                        <span className='w-12 text-left'>{report.coverage}%</span>
                        <Progress value={report.coverage} className="w-32" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
