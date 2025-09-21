
import { notFound } from 'next/navigation';
import { getComplianceReportByFramework } from '@/lib/data';
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
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
  } from '@/components/ui/breadcrumb';

const statusStyles = {
  Compliant: 'bg-accent text-accent-foreground',
  'Needs Review': 'bg-yellow-500 text-white',
  'Non-Compliant': 'bg-destructive text-destructive-foreground',
};

type ComplianceFrameworkPageProps = {
  params: {
    framework: string;
  };
};

export default function ComplianceFrameworkPage({ params }: ComplianceFrameworkPageProps) {
  const frameworkName = decodeURIComponent(params.framework);
  const report = getComplianceReportByFramework(frameworkName);

  if (!report) {
    notFound();
  }

  return (
    <div className="space-y-4">
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                <BreadcrumbLink href="/compliance">Compliance</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                <BreadcrumbPage>{report.framework}</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
      <h1 className="text-2xl font-bold">{report.framework} Details</h1>
      <p className="text-muted-foreground">
        Detailed compliance status for each control.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Controls Status</CardTitle>
          <CardDescription>
            List of controls and their current compliance status for {report.framework}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Control ID</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.controls.map((control) => (
                <TableRow key={control.id}>
                  <TableCell className="font-medium">{control.id}</TableCell>
                  <TableCell>{control.description}</TableCell>
                  <TableCell>
                    <Badge className={statusStyles[control.status as keyof typeof statusStyles]}>
                      {control.status}
                    </Badge>
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

export async function generateStaticParams() {
    const reports = getComplianceReports();
    return reports.map(report => ({
        framework: report.framework.toLowerCase(),
    }));
}
