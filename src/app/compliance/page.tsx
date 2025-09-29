
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
import { getComplianceReports } from '@/lib/data';
import Link from 'next/link';

const statusStyles = {
  Compliant: 'bg-accent text-accent-foreground',
  'Needs Review': 'bg-yellow-500 text-white',
  'Non-Compliant': 'bg-destructive text-destructive-foreground',
};

export default async function CompliancePage() {
  const complianceReports = await getComplianceReports();
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
                <TableRow key={report.framework} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <Link href={`/compliance/${report.framework.toLowerCase()}`} className="block">
                      {report.framework}
                    </Link>
                  </TableCell>
                  <TableCell>
                  <Link href={`/compliance/${report.framework.toLowerCase()}`} className="block">
                    <Badge className={statusStyles[report.status as keyof typeof statusStyles]}>
                      {report.status}
                    </Badge>
                    </Link>
                  </TableCell>
                  <TableCell><Link href={`/compliance/${report.framework.toLowerCase()}`} className="block">{report.lastAudit}</Link></TableCell>
                  <TableCell className="text-right">
                  <Link href={`/compliance/${report.framework.toLowerCase()}`} className="block">
                    <div className="flex items-center justify-end gap-2">
                        <span className='w-12 text-left'>{report.coverage}%</span>
                        <Progress value={report.coverage} className="w-32" />
                    </div>
                    </Link>
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
