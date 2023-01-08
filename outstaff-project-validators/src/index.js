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
    Table, Heading
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

const getProjects = async () => {
    console.log("Entering for getProjects");
    console.log("Before sending response");
    const response = await api.asApp().requestJira(route`/rest/api/3/project/search`, {
        headers: {
            'Accept': 'application/json'
        }
    });

    return (await response.json()).values.map(project => <Option label={project.name} value={project.id} />);

};

const CreateProjectInContract = () => {
  const [isOpen, setOpen] = useState(true);
  const [projects] = useState(async() => await getProjects());

  if (!isOpen) {
    return null;
  }

  let SelectFromList = "Select from List";
  let testCheckbox = "Test checkbox";
  return (
      <ModalDialog header="Creating Project in Contract" onClose={() => setOpen(false)}>
        <Text>Here will be parameters for creating project issue type </Text>
        <Form>
            <CheckboxGroup label={"Check something"} name={"checkboxGroup1"}>
                <Checkbox label={"Test Checkbox"} value={"Test Checkbox"} />
            </CheckboxGroup>
            <Select label={"Select from List"} name={SelectFromList}>
                {projects}
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