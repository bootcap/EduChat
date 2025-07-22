// Settings.tsx
import { useState, FunctionComponent } from 'react';
import {user_LM, user_DM, themes_LM, themes_DM, about_LM, about_DM, settings_LM, settings_DM} from "../projectAssets";
import { motion } from "framer-motion";
import { About, PersonalDetails, Themes, ApiKeys } from './sub_components';
import "../styles/Settings.scss";

type SettingsProps = {darklight: string, changeTheme: (arg: string) => void;}

const Settings : FunctionComponent<SettingsProps> = ({darklight, changeTheme}) => {

  const [current_sttngs_dlg, set_current_sttngs_dlg] = useState<string>("personal-details-settings");

  function changeSelectedSettings(idnum: string){
    let stToSelect: HTMLElement | null = document.getElementById(idnum);
    let oldSelecteed: Element | null = document.querySelector(".selected-sttngs");

    if(stToSelect != null){
      stToSelect.classList.add("selected-sttngs");
    }

    if(oldSelecteed != null){
      oldSelecteed.classList.remove("selected-sttngs");
    }
    set_current_sttngs_dlg(idnum);
  }

  return (
    <div className="settings-details-box">
      <div className="settings-navigator">
        <div className="top-bar-blur"><h1>Settings</h1></div>
        <div className="settings-selection">
          <motion.div className="sttngs_dlg-state-changer selected-sttngs" 
            onClick={() => changeSelectedSettings("personal-details-settings")} 
            whileTap={{scale: 0.97}}
            id="personal-details-settings">
            { darklight === 'light'? <img src={user_LM} alt="user"/>
            : <img src={user_DM} alt="user"/>}
            <h2>Personal details</h2>
          </motion.div>
          <motion.div className="sttngs_dlg-state-changer" 
            onClick={() => changeSelectedSettings("themes-settings")} 
            whileTap={{scale: 0.97}}
            id="themes-settings">
            { darklight === 'light'? <img src={themes_LM} alt="themes"/>
            : <img src={themes_DM} alt="themes"/>}
            <h2>Themes</h2>
          </motion.div>
          
          {/* 添加API Keys选项 */}
          <motion.div className="sttngs_dlg-state-changer" 
            onClick={() => changeSelectedSettings("api-keys-settings")} 
            whileTap={{scale: 0.97}}
            id="api-keys-settings">
            { darklight === 'light'? <img src={settings_LM} alt="api keys"/>
            : <img src={settings_DM} alt="api keys"/>}
            <h2>API Keys</h2>
          </motion.div>
          
          <motion.div className="sttngs_dlg-state-changer" 
            onClick={() => changeSelectedSettings("about-settings")}  
            whileTap={{scale: 0.97}}
            id="about-settings">
            { darklight === 'light'? <img src={about_LM} alt="about"/>
            : <img src={about_DM} alt="about"/>}
            <h2>About</h2>
          </motion.div>
        </div>
      </div>
      {
        (
          () => {
            switch(current_sttngs_dlg){
              case "personal-details-settings":
                return <PersonalDetails darklight={darklight}/>
              case "themes-settings":
                return <Themes changeTheme={changeTheme}/>
              case "api-keys-settings":
                return <ApiKeys darklight={darklight}/> // 添加ApiKeys组件
              case "about-settings":
                return <About darklight={darklight}/>
              default:
                return <PersonalDetails darklight={darklight}/>
            }
          }
        )()
      }
    </div>
  )
}

export default Settings