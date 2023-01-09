import ForgeUI, {
    Select,
    Form,
    Option,
    AdminPage,
    render,
    useAction,
    Checkbox,
    CheckboxGroup,
    useState,
    ModalDialog,
    IssueContext,
    Text,
    IssueAction,
    Table, Heading, TextField
} from "@forge/ui";
import api, {properties, asApp, asUser, route, requestJira} from '@forge/api';
import { view } from '@forge/bridge';

export const run = args => {
  [issue] = args.issue;


  return {
    result: result,
    errorMessage: `Issue ${issue.key} is not ready for transition from status ${from.id} to ${to.id}`,
  }
};


const CreateProjectInContract = () => {
  const [isOpen, setOpen] = useState(true);

  const [issuesFromDocs] = useState(async () => {
      var bodyData = {
          "expand": [
            "names",
            "schema",
            "operations"
          ],
          "jql": "project = DOC",
          "maxResults": 50,
          "fieldsByKeys": false,
          "fields": [
            "summary",
            "status",
            "assignee"
          ],
          "startAt": 0
        };

      const response = await api.asUser().requestJira(route`/rest/api/3/search`, {
          method: 'POST',
          headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(bodyData)
      });

      return (await response.json()).issues.map(issue => <Option label={issue.fields.summary} value={issue.key} />);
  });

  if (!isOpen) {
    return null;
  }

  let issuesFromDocuments = "issuesFromDocuments";
  let newProjectName = "Project Name";
  let newProjectKey = "Project Key"
  return (
      <ModalDialog header="Creating Project in Contract" onClose={() => setOpen(false)}>
        <Form>
            <TextField name={newProjectName} label={newProjectName} />
            <TextField name={newProjectKey} label={newProjectKey} />

            <Select label={issuesFromDocuments} name={issuesFromDocuments}>
                {issuesFromDocs}
            </Select>

        </Form>
      </ModalDialog>
  );
};

export const createProject = render(
    <IssueAction>
      <CreateProjectInContract />
    </IssueAction>
);