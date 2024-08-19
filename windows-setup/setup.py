setup_version = "0.0.3";

import urllib.request;
from zipfile import ZipFile;
import tempfile;
import os;
import os.path;
import shutil;
import webbrowser;
import subprocess;
import sys;
import tkinter;
from tkinter import ttk;

temp_dir = tempfile.gettempdir()+"\\";
newflow_download = "https://github.com/malisipi/NewFlow/archive/refs/heads/main.zip";
electron_download = "https://github.com/electron/electron/releases/download/v31.4.0/electron-v31.4.0-win32-x64.zip";
ytextratorjs_download = "https://github.com/malisipi/yt-extractor.js/archive/refs/heads/main.zip";
electron_ver = "v31.4.0";

def read_license():
   webbrowser.open("https://www.apache.org/licenses/LICENSE-2.0.txt");

def open_website():
   webbrowser.open("https://github.com/malisipi/NewFlow/");

def update_state(info):
   state_text["text"] = info;
   show_progress(0,0,1);
   setup_window.update();

def show_progress(block_num, block_size, total_size):
   global state
   if(total_size<1):
      if(state_progress["mode"] != "indeterminate"):
         state_progress["mode"] = "indeterminate";
      state_progress["value"]=(block_num%250)/250;
   else:
      if(state_progress["mode"] != "determinate"):
         state_progress["mode"] = "determinate";
      state_progress["value"]=int((block_num*block_size*100)/total_size);
   setup_window.update();

def newflow_install():
   update_state("Downloading Electron Launcher...");
   if(not os.path.exists(temp_dir + "electron" + electron_ver + ".zip")):
      urllib.request.urlretrieve(electron_download, temp_dir + "electron" + electron_ver + ".zip", show_progress);

   update_state("Downloading NewFlow...");
   urllib.request.urlretrieve(newflow_download, temp_dir + "newflow.zip", show_progress);

   update_state("Downloading yt-extractor...");
   urllib.request.urlretrieve(ytextratorjs_download, temp_dir + "ytextractor.zip", show_progress);

   update_state("Extracting Electron Launcher...");
   zip_archive = ZipFile(temp_dir + "electron" + electron_ver + ".zip");
   zip_archive.extractall("C:/Programs/NewFlow/");
   os.remove("C:/Programs/NewFlow/resources/default_app.asar");

   update_state("Extracting NewFlow...");
   zip_archive = ZipFile(temp_dir + "newflow.zip");
   zip_archive.extractall("C:/Programs/NewFlow/resources/");
   if(os.path.exists("C:/Programs/NewFlow/resources/app")):
      if(os.path.exists("C:/Programs/NewFlow/resources/app/dbs")):
         if(os.path.exists("C:/Programs/NewFlow/__dbs_backup")):
            shutil.rmtree("C:/Programs/NewFlow/__dbs_backup");
         os.rename("C:/Programs/NewFlow/resources/app/dbs","C:/Programs/NewFlow/__dbs_backup");
      shutil.rmtree("C:/Programs/NewFlow/resources/app");
      os.rename("C:/Programs/NewFlow/resources/NewFlow-main","C:/Programs/NewFlow/resources/app");
      if(os.path.exists("C:/Programs/NewFlow/__dbs_backup")):
         os.rename("C:/Programs/NewFlow/__dbs_backup","C:/Programs/NewFlow/resources/app/dbs");
   else:
      os.rename("C:/Programs/NewFlow/resources/NewFlow-main","C:/Programs/NewFlow/resources/app");
      if(not os.path.exists("C:/Programs/NewFlow/resources/app/dbs")):
         os.mkdir("C:/Programs/NewFlow/resources/app/dbs");

   update_state("Extracting yt-extractor...");
   zip_archive = ZipFile(temp_dir + "ytextractor.zip");
   zip_archive.extractall("C:/Programs/NewFlow/resources/app/");
   if(os.path.exists("C:/Programs/NewFlow/resources/app/yt-extractor")):
      shutil.rmtree("C:/Programs/NewFlow/resources/app/yt-extractor");
   os.rename("C:/Programs/NewFlow/resources/app/yt-extractor.js-main","C:/Programs/NewFlow/resources/app/yt-extractor");

   update_state("Creating Shortcuts");
   subprocess.run(["wscript", "C:/Programs/NewFlow/resources/app/scripts/create_launcher.vbs"]);

   update_state("Finished!");
   show_progress(1,1,1);

def clear_cache():
   if(os.path.exists(temp_dir + "electron" + electron_ver + ".zip")):
      os.remove(temp_dir + "electron" + electron_ver + ".zip");
   if(os.path.exists(temp_dir + "newflow.zip")):
      os.remove(temp_dir + "newflow.zip");
   if(os.path.exists(temp_dir + "ytextractor.zip")):
      os.remove(temp_dir + "ytextractor.zip");

setup_window = tkinter.Tk();
setup_window.title("NewFlow - Setup " + setup_version);
setup_window.resizable(False, False);
setup_window.geometry('400x200');

state_text = tkinter.Label(setup_window, text="Setup is ready!", justify="center");
state_text.place(x=60, y=40, width=280, height=25);
state_progress = ttk.Progressbar(setup_window, length=100);
state_progress.place(x=60, y=80, width=280, height=25);
install_button = ttk.Button(setup_window, text='Install NewFlow', command=newflow_install);
install_button.place(x=100, y=120, width=200, height=25);
website_button = ttk.Button(setup_window, text='Open Website', command=open_website);
website_button.place(x=20, y=155, width=100, height=25);
license_button = ttk.Button(setup_window, text='Read License', command=read_license);
license_button.place(x=280, y=155, width=100, height=25);
clear_cache_button = ttk.Button(setup_window, text='Clear Cache', command=clear_cache);
clear_cache_button.place(x=150, y=155, width=100, height=25);

setup_window.mainloop();
